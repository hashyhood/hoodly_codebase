-- Unify app↔DB: posts, counters, DMs, groups, safety, invites, indexes, base rate limits
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- posts: author_id -> user_id + app columns
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='author_id')
  and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='user_id')
  then alter table public.posts rename column author_id to user_id; end if;
end $$;

alter table public.posts
  add column if not exists likes_count int default 0,
  add column if not exists comments_count int default 0,
  add column if not exists proximity text default 'city' check (proximity in ('neighborhood','city','state')),
  add column if not exists tags text[] default '{}',
  add column if not exists image_url text;

-- posts_user_id_fkey to profiles (for PostgREST joins)
do $$
begin
  if exists (select 1 from information_schema.table_constraints where table_schema='public' and table_name='posts' and constraint_name='posts_user_id_fkey')
  then alter table public.posts rename constraint posts_user_id_fkey to posts_user_id_auth_fkey; end if;
  if exists (select 1 from information_schema.table_constraints where table_schema='public' and table_name='posts' and constraint_name='posts_author_id_fkey')
  then alter table public.posts rename constraint posts_author_id_fkey to posts_user_id_auth_fkey; end if;
  if not exists (select 1 from information_schema.table_constraints where table_schema='public' and table_name='posts' and constraint_name='posts_user_id_fkey')
  then alter table public.posts
    add constraint posts_user_id_fkey foreign key (user_id) references public.profiles(id) on delete cascade; end if;
end $$;

-- counters from reactions/comments
create or replace function public.update_post_like_count() returns trigger language plpgsql as $$
begin
  update public.posts p
  set likes_count = (
    select count(*) from public.reactions r
    where r.target_type='post' and r.target_id = coalesce(new.target_id, old.target_id) and r.reaction_type='like'
  )
  where p.id = coalesce(new.target_id, old.target_id);
  return new;
end $$;

drop trigger if exists trg_reaction_like_total_ins on public.reactions;
create trigger trg_reaction_like_total_ins
after insert or delete on public.reactions
for each row when ((coalesce(new.target_type, old.target_type)='post') and (coalesce(new.reaction_type, old.reaction_type)='like'))
execute function public.update_post_like_count();

create or replace function public.update_post_comment_count() returns trigger language plpgsql as $$
begin
  update public.posts p
  set comments_count = (select count(*) from public.comments c where c.post_id = coalesce(new.post_id, old.post_id))
  where p.id = coalesce(new.post_id, old.post_id);
  return new;
end $$;

drop trigger if exists trg_comments_count_ins on public.comments;
drop trigger if exists trg_comments_count_del on public.comments;
create trigger trg_comments_count_ins after insert on public.comments for each row execute function public.update_post_comment_count();
create trigger trg_comments_count_del after delete on public.comments for each row execute function public.update_post_comment_count();

-- DMs: threads + messages + RPC
create table if not exists public.dm_threads(
  id uuid primary key default uuid_generate_v4(),
  user1_id uuid not null references auth.users(id) on delete cascade,
  user2_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique (least(user1_id,user2_id), greatest(user1_id,user2_id))
);
create table if not exists public.dm_messages(
  id uuid primary key default uuid_generate_v4(),
  thread_id uuid not null references public.dm_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  message_type text default 'text' check (message_type in ('text','image','video','audio','location')),
  is_read boolean default false,
  metadata jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
do $$
begin
  if exists (select 1 from information_schema.table_constraints where table_schema='public' and table_name='dm_messages' and constraint_name='dm_messages_sender_id_fkey')
  then alter table public.dm_messages rename constraint dm_messages_sender_id_fkey to dm_messages_sender_id_auth_fkey; end if;
  if exists (select 1 from information_schema.table_constraints where table_schema='public' and table_name='dm_messages' and constraint_name='dm_messages_receiver_id_fkey')
  then alter table public.dm_messages rename constraint dm_messages_receiver_id_fkey to dm_messages_receiver_id_auth_fkey; end if;
  if not exists (select 1 from information_schema.table_constraints where table_schema='public' and table_name='dm_messages' and constraint_name='dm_messages_sender_id_fkey')
  then alter table public.dm_messages add constraint dm_messages_sender_id_fkey foreign key (sender_id) references public.profiles(id) on delete cascade; end if;
  if not exists (select 1 from information_schema.table_constraints where table_schema='public' and table_name='dm_messages' and constraint_name='dm_messages_receiver_id_fkey')
  then alter table public.dm_messages add constraint dm_messages_receiver_id_fkey foreign key (receiver_id) references public.profiles(id) on delete cascade; end if;
end $$;

create or replace function public.get_or_create_thread(a uuid, b uuid) returns uuid
language plpgsql security definer as $$
declare t_id uuid;
begin
  if a=b then raise exception 'cannot DM yourself'; end if;
  select id into t_id from public.dm_threads where (user1_id=least(a,b) and user2_id=greatest(a,b));
  if t_id is null then
    insert into public.dm_threads(user1_id,user2_id) values(least(a,b), greatest(a,b)) returning id into t_id;
  end if;
  return t_id;
end $$;
grant execute on function public.get_or_create_thread(uuid,uuid) to authenticated;

-- groups, members
create table if not exists public.groups(
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  creator_id uuid not null references auth.users(id) on delete cascade,
  is_private boolean default false,
  member_count int default 0,
  created_at timestamptz default now()
);
create table if not exists public.group_members(
  id uuid primary key default uuid_generate_v4(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text default 'member' check (role in ('admin','member')),
  joined_at timestamptz default now(),
  unique(group_id,user_id)
);
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
create policy groups_read on public.groups for select using (is_private=false or creator_id=auth.uid() or exists (select 1 from public.group_members gm where gm.group_id=groups.id and gm.user_id=auth.uid()));
create policy groups_write on public.groups for insert with check (creator_id=auth.uid());
create policy group_members_read on public.group_members for select using (user_id=auth.uid() or exists (select 1 from public.groups g where g.id=group_id and g.creator_id=auth.uid()));
create policy group_members_write on public.group_members for insert with check (user_id=auth.uid());

-- safety alerts
create table if not exists public.safety_alerts(
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('emergency','warning','info')),
  message text not null,
  location geography(point,4326),
  created_at timestamptz default now()
);
alter table public.safety_alerts enable row level security;
create policy safety_read on public.safety_alerts for select using (true);
create policy safety_write on public.safety_alerts for insert with check (user_id=auth.uid());

-- invite links
create table if not exists public.invite_links(
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  type text not null check (type in ('user','group','event')),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  expires_at timestamptz,
  max_uses int,
  current_uses int default 0,
  is_active boolean default true,
  metadata jsonb
);
alter table public.invite_links enable row level security;
create policy invites_read on public.invite_links for select using (true);
create policy invites_write on public.invite_links for insert with check (created_by=auth.uid());

-- indexes
create index if not exists idx_posts_created_at on public.posts(created_at desc);
create index if not exists idx_comments_post_created on public.comments(post_id, created_at desc);
create index if not exists idx_reactions_target on public.reactions(target_type, target_id, reaction_type);
create index if not exists idx_notifications_receiver_created on public.notifications(receiver_id, created_at desc);

-- base rate limits (posts/comments/reactions)
create or replace function public.enforce_rate_limit(tbl regclass, max_count int, window interval) returns void
language plpgsql security definer as $$
declare cnt int;
begin
  execute format('select count(*) from %s where user_id = auth.uid() and created_at > now() - $1', tbl)
  into cnt using window;
  if cnt >= max_count then raise exception 'rate_limit_exceeded'; end if;
end $$;

create or replace function public.posts_rate_limit() returns trigger language plpgsql security definer as $$ begin perform public.enforce_rate_limit('public.posts',5,'5 minutes'); return new; end $$;
drop trigger if exists trg_posts_rate on public.posts;
create trigger trg_posts_rate before insert on public.posts for each row execute function public.posts_rate_limit();

create or replace function public.comments_rate_limit() returns trigger language plpgsql security definer as $$ begin perform public.enforce_rate_limit('public.comments',15,'5 minutes'); return new; end $$;
drop trigger if exists trg_comments_rate on public.comments;
create trigger trg_comments_rate before insert on public.comments for each row execute function public.comments_rate_limit();

create or replace function public.reactions_rate_limit() returns trigger language plpgsql security definer as $$ begin perform public.enforce_rate_limit('public.reactions',60,'5 minutes'); return new; end $$;
drop trigger if exists trg_reactions_rate on public.reactions;
create trigger trg_reactions_rate before insert on public.reactions for each row execute function public.reactions_rate_limit();
