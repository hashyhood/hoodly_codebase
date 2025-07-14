-- Fix infinite recursion in room_members RLS policies
-- Run this in your Supabase SQL Editor

-- Remove the problematic policies first
DROP POLICY IF EXISTS "Users can view room members" ON room_members;
DROP POLICY IF EXISTS "Users can manage room members" ON room_members;

-- Allow users to view room members if they are a member of the room
CREATE POLICY "Users can view room members" ON room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_members AS m
      WHERE m.room_id = room_members.room_id AND m.user_id = auth.uid()
    )
  );

-- Allow admins/moderators to manage members
CREATE POLICY "Users can manage room members" ON room_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM room_members AS m
      WHERE m.room_id = room_members.room_id AND m.user_id = auth.uid() AND m.role IN ('admin', 'moderator')
    )
  ); 