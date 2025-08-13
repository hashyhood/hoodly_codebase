-- Indexes + message rate limits + geo
create index if not exists idx_messages_room_created on public.messages(room_id, created_at);
create index if not exists idx_dm_messages_pair_created on public.dm_messages(sender_id, receiver_id, created_at desc);
create index if not exists idx_posts_location_gist on public.posts using gist (location);

create or replace function public.messages_rate_limit() returns trigger language plpgsql security definer as $$
begin perform public.enforce_rate_limit('public.messages',120,'5 minutes'); return new; end $$;
drop trigger if exists trg_messages_rate on public.messages;
create trigger trg_messages_rate before insert on public.messages for each row execute function public.messages_rate_limit();

create or replace function public.dm_messages_rate_limit() returns trigger language plpgsql security definer as $$
begin perform public.enforce_rate_limit('public.dm_messages',120,'5 minutes'); return new; end $$;
drop trigger if exists trg_dm_messages_rate on public.dm_messages;
create trigger trg_dm_messages_rate before insert on public.dm_messages for each row execute function public.dm_messages_rate_limit();
