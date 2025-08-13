-- Settings, personalization, analytics, user locations, location sharing, discovery, ads, advanced RPCs
create extension if not exists postgis;

-- user settings
create table if not exists public.user_settings(
  user_id uuid primary key references auth.users(id) on delete cascade,
  feed_default text default 'ranked' check (feed_default in ('ranked','recent','nearby','following')),
  notification_prefs jsonb default '{}'::jsonb,
  location_privacy jsonb default '{"shareLocation":true,"visibleToFriends":true,"visibleToNeighbors":false,"visibleToPublic":false,"locationAccuracy":"balanced","maxDistanceKm":5}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.user_settings enable row level security;
create policy user_settings_rw on public.user_settings for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

-- feed weights + interests
create table if not exists public.feed_preferences(
  user_id uuid primary key references auth.users(id) on delete cascade,
  w_freshness double precision default 0.45,
  w_proximity double precision default 0.25,
  w_engagement double precision default 0.20,
  w_follow double precision default 0.06,
  w_interest double precision default 0.04,
  updated_at timestamptz default now()
);
alter table public.feed_preferences enable row level security;
create policy feed_prefs_rw on public.feed_preferences for all using (auth.uid()=user_id) with check (auth.uid()=user_id);

create table if not exists public.user_interests(
  user_id uuid references auth.users(id) on delete cascade,
  tag text not null,
  weight double precision default 1.0,
  primary key (user_id, tag)
);
alter table public.user_interests enable row level security;
create policy user_interests_rw on public.user_interests for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create index if not exists idx_posts_tags_gin on public.posts using gin (tags);

-- analytics
create table if not exists public.analytics_events(
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  event text not null,
  target_type text,
  target_id uuid,
  props jsonb,
  created_at timestamptz default now()
);
alter table public.analytics_events enable row level security;
create policy analytics_insert on public.analytics_events for insert with check (auth.uid()=user_id or user_id is null);
create index if not exists idx_analytics_user_created on public.analytics_events(user_id, created_at desc);

-- last known user location
create table if not exists public.user_locations(
  user_id uuid primary key references auth.users(id) on delete cascade,
  location geography(point,4326),
  accuracy_m double precision,
  updated_at timestamptz default now()
);
alter table public.user_locations enable row level security;
create policy user_locations_rw on public.user_locations for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create index if not exists idx_user_locations_gist on public.user_locations using gist (location);

-- location sharing
create table if not exists public.location_shares(
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  shared_with uuid not null references auth.users(id) on delete cascade,
  is_live boolean default true,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, shared_with)
);
alter table public.location_shares enable row level security;
create policy location_shares_owner on public.location_shares for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy location_shares_viewer on public.location_shares for select using (auth.uid()=shared_with or auth.uid()=user_id);

-- discovery
create table if not exists public.events(
  id uuid primary key default uuid_generate_v4(),
  creator_id uuid references auth.users(id) on delete set null,
  title text not null,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  location geography(point,4326),
  tags text[] default '{}',
  created_at timestamptz default now()
);
alter table public.events enable row level security;
create policy events_read on public.events for select using (true);
create policy events_write on public.events for insert with check (auth.uid()=creator_id);

create table if not exists public.businesses(
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text,
  location geography(point,4326),
  url text,
  verified boolean default false,
  created_at timestamptz default now()
);
alter table public.businesses enable row level security;
create policy businesses_read on public.businesses for select using (true);

-- ads
create table if not exists public.ad_campaigns(
  id uuid primary key default uuid_generate_v4(),
  business_id uuid references public.businesses(id) on delete cascade,
  name text not null,
  budget_cents bigint default 0,
  start_at timestamptz not null,
  end_at timestamptz,
  targeting jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.ad_campaigns enable row level security;
create policy ad_campaigns_read on public.ad_campaigns for select using (true);

create table if not exists public.sponsored_posts(
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.ad_campaigns(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(campaign_id, post_id)
);
alter table public.sponsored_posts enable row level security;
create policy sponsored_posts_read on public.sponsored_posts for select using (true);

create table if not exists public.ad_impressions(
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references public.ad_campaigns(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz default now()
);
alter table public.ad_impressions enable row level security;
create policy ad_impressions_insert on public.ad_impressions for insert with check (true);

-- RPCs: trending, friend suggestions, ranked v2 (weights & interests)
create or replace function public.trending_posts(lat double precision, lng double precision, radius_km double precision, hours int, limit_n int default 20)
returns setof public.posts language sql stable as $$
  select p.* from public.posts p
  where p.location is not null
    and st_dwithin(p.location, st_setsrid(st_makepoint(lng,lat),4326)::geography, radius_km*1000)
    and p.created_at > now() - make_interval(hours => hours)
  order by (coalesce(p.likes_count,0) + 2*coalesce(p.comments_count,0)) / greatest(1, extract(epoch from (now()-p.created_at))/3600)::numeric desc
  limit limit_n;
$$;

create or replace function public.suggest_friends(u uuid, lat double precision, lng double precision, limit_n int default 20)
returns table (profile_id uuid, score double precision) language sql stable as $$
  with mutuals as (
    select f2.following_id as candidate, count(*) as shared
    from follows f1 join follows f2 on f1.following_id = f2.follower_id
    where f1.follower_id = u and f2.following_id <> u
    group by f2.following_id
  ), proximity as (
    select pr.id pid, case when ul.location is null then 0.3
      else 1.0/(1.0 + st_distance(ul.location, st_setsrid(st_makepoint(lng,lat),4326)::geography)/1000.0) end prox
    from profiles pr left join user_locations ul on ul.user_id = pr.id
  )
  select pr.id, coalesce(m.shared,0)*0.4 + coalesce(p.prox,0)*0.6 as score
  from profiles pr left join mutuals m on m.candidate = pr.id left join proximity p on p.pid = pr.id
  where pr.id <> u
  order by score desc
  limit limit_n;
$$;

create or replace function public.feed_rank_v2(u uuid, lat double precision, lng double precision, limit_n int default 20, offset_n int default 0)
returns setof public.posts language sql stable as $$
  with prefs as (
    select coalesce(w_freshness,0.45) wf, coalesce(w_proximity,0.25) wp, coalesce(w_engagement,0.20) we,
           coalesce(w_follow,0.06) wfo, coalesce(w_interest,0.04) wi
    from feed_preferences where user_id=u
  ), follow_rel as (select following_id from follows where follower_id=u),
  interest as (select tag, weight from user_interests where user_id=u),
  scored as (
    select p.*,
      (1.0/(1.0 + extract(epoch from (now()-p.created_at))/3600.0)) as freshness,
      (case when p.location is null then 0.4
            else 1.0/(1.0 + st_distance(p.location, st_setsrid(st_makepoint(lng,lat),4326)::geography)/1000.0) end) as proximity,
      (ln(1 + coalesce(p.likes_count,0) + 2*coalesce(p.comments_count,0))) as engagement,
      (case when p.user_id in (select following_id from follow_rel) then 1 else 0 end) as follow_signal,
      (select coalesce(sum(i.weight),0) from unnest(p.tags) t(tag) left join interest i on t.tag=i.tag) as interest_score
    from posts p
  )
  select s.* from scored s, prefs
  order by (prefs.wf*s.freshness + prefs.wp*s.proximity + prefs.we*s.engagement + prefs.wfo*s.follow_signal + prefs.wi*s.interest_score) desc, s.created_at desc
  limit limit_n offset offset_n;
$$;
