-- === HOODLY FEATURE PACK (idempotent) ===
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1) USER SETTINGS (notification prefs, feed default, privacy)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_default text DEFAULT 'ranked' CHECK (feed_default IN ('ranked','recent','nearby','following')),
  notification_prefs jsonb DEFAULT '{}'::jsonb,
  location_privacy jsonb DEFAULT '{"shareLocation":true,"visibleToFriends":true,"visibleToNeighbors":false,"visibleToPublic":false,"locationAccuracy":"balanced","maxDistanceKm":5}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_settings_rw ON public.user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) PERSONALIZATION WEIGHTS & INTERESTS
CREATE TABLE IF NOT EXISTS public.feed_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  w_freshness double precision DEFAULT 0.45,
  w_proximity double precision DEFAULT 0.25,
  w_engagement double precision DEFAULT 0.20,
  w_follow double precision DEFAULT 0.06,
  w_interest double precision DEFAULT 0.04,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.feed_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY feed_prefs_rw ON public.feed_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.user_interests (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  tag text NOT NULL,
  weight double precision DEFAULT 1.0,
  PRIMARY KEY (user_id, tag)
);
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_interests_rw ON public.user_interests
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fast tag filtering
CREATE INDEX IF NOT EXISTS idx_posts_tags_gin ON public.posts USING GIN (tags);

-- 3) ANALYTICS EVENTS
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event text NOT NULL,
  target_type text,
  target_id uuid,
  props jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY analytics_insert ON public.analytics_events FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE INDEX IF NOT EXISTS idx_analytics_user_created ON public.analytics_events(user_id, created_at DESC);

-- 4) LAST KNOWN LOCATION (for geo notifications & suggestions)
CREATE TABLE IF NOT EXISTS public.user_locations (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  location geography(POINT,4326),
  accuracy_m double precision,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_locations_rw ON public.user_locations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_gist ON public.user_locations USING GIST (location);

-- 5) LOCATION SHARING
CREATE TABLE IF NOT EXISTS public.location_shares (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_live boolean DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, shared_with)
);
ALTER TABLE public.location_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY location_shares_owner ON public.location_shares FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY location_shares_viewer ON public.location_shares FOR SELECT USING (auth.uid() = shared_with OR auth.uid() = user_id);

-- 6) DISCOVERY: EVENTS, BUSINESSES
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  location geography(POINT,4326),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_read ON public.events FOR SELECT USING (true);
CREATE POLICY events_write ON public.events FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE TABLE IF NOT EXISTS public.businesses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text,
  location geography(POINT,4326),
  url text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY businesses_read ON public.businesses FOR SELECT USING (true);

-- 7) MONETIZATION: CAMPAIGNS & SPONSORED POSTS
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  budget_cents bigint DEFAULT 0,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  targeting jsonb DEFAULT '{}'::jsonb, -- {radius_km, city, tags}
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY ad_campaigns_read ON public.ad_campaigns FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.sponsored_posts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  post_id uuid REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(campaign_id, post_id)
);
ALTER TABLE public.sponsored_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY sponsored_posts_read ON public.sponsored_posts FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.ad_impressions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ad_impressions_insert ON public.ad_impressions FOR INSERT WITH CHECK (true);

-- 8) RPCs: trending, suggestions, personalized feed v2
CREATE OR REPLACE FUNCTION public.trending_posts(lat double precision, lng double precision, radius_km double precision, hours int, limit_n int DEFAULT 20)
RETURNS SETOF public.posts LANGUAGE sql STABLE AS $$
  SELECT p.* FROM public.posts p
  WHERE p.location IS NOT NULL
    AND ST_DWithin(p.location, ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography, radius_km*1000)
    AND p.created_at > now() - make_interval(hours => hours)
  ORDER BY (COALESCE(p.likes_count,0) + 2*COALESCE(p.comments_count,0)) / GREATEST(1, EXTRACT(EPOCH FROM (now()-p.created_at))/3600)::numeric DESC
  LIMIT limit_n;
$$;

CREATE OR REPLACE FUNCTION public.suggest_friends(u uuid, lat double precision, lng double precision, limit_n int DEFAULT 20)
RETURNS TABLE (profile_id uuid, score double precision) LANGUAGE sql STABLE AS $$
  WITH mutuals AS (
    SELECT f2.following_id AS candidate, COUNT(*) AS shared
    FROM follows f1
    JOIN follows f2 ON f1.following_id = f2.follower_id
    WHERE f1.follower_id = u AND f2.following_id <> u
    GROUP BY f2.following_id
  ), proximity AS (
    SELECT pr.id AS pid, CASE WHEN ul.location IS NULL THEN 0.3
      ELSE 1.0/(1.0 + ST_Distance(ul.location, ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography)/1000.0) END AS prox
    FROM profiles pr
    LEFT JOIN user_locations ul ON ul.user_id = pr.id
  )
  SELECT pr.id, COALESCE(m.shared,0)*0.4 + COALESCE(p.prox,0)*0.6 AS score
  FROM profiles pr
  LEFT JOIN mutuals m ON m.candidate = pr.id
  LEFT JOIN proximity p ON p.pid = pr.id
  WHERE pr.id <> u
  ORDER BY score DESC
  LIMIT limit_n;
$$;

CREATE OR REPLACE FUNCTION public.feed_rank_v2(u uuid, lat double precision, lng double precision, limit_n int DEFAULT 20, offset_n int DEFAULT 0)
RETURNS SETOF public.posts LANGUAGE sql STABLE AS $$
  WITH prefs AS (
    SELECT COALESCE(w_freshness,0.45) AS wf, COALESCE(w_proximity,0.25) AS wp, COALESCE(w_engagement,0.20) AS we,
           COALESCE(w_follow,0.06) AS wfo, COALESCE(w_interest,0.04) AS wi
    FROM feed_preferences WHERE user_id = u
  ), follow_rel AS (
    SELECT following_id FROM follows WHERE follower_id = u
  ), interest AS (
    SELECT tag, weight FROM user_interests WHERE user_id = u
  ), scored AS (
    SELECT p.*,
      (1.0 / (1.0 + EXTRACT(EPOCH FROM (now()-p.created_at))/3600.0))                       AS freshness,
      (CASE WHEN p.location IS NULL THEN 0.4
            ELSE 1.0/(1.0 + ST_Distance(p.location, ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography)/1000.0) END) AS proximity,
      (LN(1 + COALESCE(p.likes_count,0) + 2*COALESCE(p.comments_count,0)))                  AS engagement,
      (CASE WHEN p.user_id IN (SELECT following_id FROM follow_rel) THEN 1 ELSE 0 END)      AS follow_signal,
      (SELECT COALESCE(SUM(i.weight),0) FROM unnest(p.tags) t(tag) LEFT JOIN interest i ON t.tag = i.tag) AS interest_score
    FROM posts p
  )
  SELECT s.*
  FROM scored s, prefs
  ORDER BY (prefs.wf*s.freshness + prefs.wp*s.proximity + prefs.we*s.engagement + prefs.wfo*s.follow_signal + prefs.wi*s.interest_score) DESC, s.created_at DESC
  LIMIT limit_n OFFSET offset_n;
$$;
