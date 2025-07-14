-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime on inserts
-- (Supabase Realtime listens to all row-level changes by default)

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only allow users to SELECT their own notifications
CREATE POLICY "Users can select their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

-- Only allow users to INSERT notifications for themselves
CREATE POLICY "Users can insert their own notifications" ON notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Allow users to UPDATE is_read for their own notifications
CREATE POLICY "Users can mark their notifications as read" ON notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC); 