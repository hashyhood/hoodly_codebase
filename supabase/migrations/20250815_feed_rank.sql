-- === HOODLY FEED RANKING FUNCTION ===

-- Create a function to rank posts by freshness, proximity, and engagement
CREATE OR REPLACE FUNCTION public.feed_rank(u uuid, lat double precision, lng double precision, limit_n int DEFAULT 20, offset_n int DEFAULT 0)
RETURNS SETOF public.posts
LANGUAGE sql STABLE AS $$
  SELECT p.*
  FROM public.posts p
  LEFT JOIN LATERAL (
    SELECT 
      CASE 
        WHEN p.location IS NOT NULL THEN 
          1.0 / (1.0 + ST_Distance(p.location::geography, ST_SetSRID(ST_MakePoint(lng,lat),4326)::geography) / 1000.0)
        ELSE 0.0 
      END AS proximity
  ) d ON true
  LEFT JOIN LATERAL (
    SELECT EXTRACT(EPOCH FROM (now() - p.created_at)) AS age_sec
  ) a ON true
  ORDER BY
    (0.5 * exp(-(a.age_sec)/ (60*60*12))) -- freshness (12 hour half-life)
  + (0.3 * COALESCE(d.proximity, 0.0))    -- proximity (inverse distance)
  + (0.2 * ln(1 + COALESCE(p.likes_count,0) + COALESCE(p.comments_count,0))) DESC -- engagement
  LIMIT limit_n OFFSET offset_n;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.feed_rank(uuid, double precision, double precision, int, int) TO authenticated;
