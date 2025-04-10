-- Modify emotional_story column to handle large text
ALTER TABLE public.user_preferences
ALTER COLUMN emotional_story TYPE TEXT;

-- Add a check constraint to ensure minimum length
ALTER TABLE public.user_preferences
ADD CONSTRAINT emotional_story_min_length 
CHECK (
  emotional_story IS NULL OR 
  length(emotional_story) >= 200
); 