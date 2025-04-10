-- Add emotional_story column to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS emotional_story TEXT; 