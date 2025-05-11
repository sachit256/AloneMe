-- Add aloneme_user_id column to user_preferences
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS aloneme_user_id TEXT;

-- Make aloneme_user_id unique
ALTER TABLE public.user_preferences
ADD CONSTRAINT unique_aloneme_user_id UNIQUE (aloneme_user_id);

-- Function to generate a unique aloneme_user_id
CREATE OR REPLACE FUNCTION generate_unique_aloneme_user_id(display_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_username TEXT;
    random_num TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
    result_id TEXT;
BEGIN
    -- Generate base username from display_name or use 'user' as fallback
    base_username := LOWER(REGEXP_REPLACE(COALESCE(display_name, 'user'), '[^a-zA-Z0-9]', '', 'g'));
    
    -- Keep trying until we find a unique aloneme_user_id or reach max attempts
    WHILE attempts < max_attempts LOOP
        -- Generate a random 4-digit number
        random_num := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Combine username with random number
        result_id := '@' || base_username || random_num;
        
        -- Check if this aloneme_user_id is already taken
        IF NOT EXISTS (
            SELECT 1 
            FROM public.user_preferences 
            WHERE aloneme_user_id = result_id
        ) THEN
            -- If not taken, we can use it
            RETURN result_id;
        END IF;
        
        attempts := attempts + 1;
    END LOOP;
    
    -- If we couldn't generate a unique ID after max attempts, use timestamp
    RETURN '@' || base_username || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS');
END;
$$ LANGUAGE plpgsql;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_generate_aloneme_user_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.aloneme_user_id IS NULL THEN
        NEW.aloneme_user_id := generate_unique_aloneme_user_id(NEW.display_name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS generate_aloneme_user_id_trigger ON public.user_preferences;
CREATE TRIGGER generate_aloneme_user_id_trigger
    BEFORE INSERT OR UPDATE ON public.user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_aloneme_user_id();

-- Update existing rows
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id, display_name FROM public.user_preferences WHERE aloneme_user_id IS NULL
    LOOP
        UPDATE public.user_preferences
        SET aloneme_user_id = generate_unique_aloneme_user_id(r.display_name)
        WHERE id = r.id;
    END LOOP;
END $$; 