-- Non-destructive migration to add geo discovery fields to rooms
-- Adds latitude, longitude, city, neighborhood; creates indexes

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE rooms ADD COLUMN latitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE rooms ADD COLUMN longitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'city'
  ) THEN
    ALTER TABLE rooms ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE rooms ADD COLUMN neighborhood TEXT;
  END IF;
END $$;

-- Helpful indexes for discovery queries
CREATE INDEX IF NOT EXISTS idx_rooms_city ON rooms(city);
CREATE INDEX IF NOT EXISTS idx_rooms_neighborhood ON rooms(neighborhood);
CREATE INDEX IF NOT EXISTS idx_rooms_lat_lng ON rooms(latitude, longitude);

-- Non-destructive migration to add geo discovery fields to rooms
-- Adds latitude, longitude, city, neighborhood; creates indexes

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE rooms ADD COLUMN latitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE rooms ADD COLUMN longitude DOUBLE PRECISION;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'city'
  ) THEN
    ALTER TABLE rooms ADD COLUMN city TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rooms' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE rooms ADD COLUMN neighborhood TEXT;
  END IF;
END $$;

-- Helpful indexes for discovery queries
CREATE INDEX IF NOT EXISTS idx_rooms_city ON rooms(city);
CREATE INDEX IF NOT EXISTS idx_rooms_neighborhood ON rooms(neighborhood);
CREATE INDEX IF NOT EXISTS idx_rooms_lat_lng ON rooms(latitude, longitude);

