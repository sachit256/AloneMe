-- Migration Script for user_service_availability table

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.user_service_availability (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL CHECK (service_type IN ('Chat', 'AudioCall', 'VideoCall')),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (user_id, service_type) -- Composite primary key
);

-- 2. Add comments (optional but recommended)
COMMENT ON TABLE public.user_service_availability IS 'Stores the availability status of users for different service types (Chat, AudioCall, VideoCall).';
COMMENT ON COLUMN public.user_service_availability.service_type IS 'Type of service: Chat, AudioCall, or VideoCall.';
COMMENT ON COLUMN public.user_service_availability.is_available IS 'Indicates if the user is currently available for this service type.';

-- 3. Enable Row Level Security (RLS) - IMPORTANT
ALTER TABLE public.user_service_availability ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
--    Policy 1: Allow users to view their own availability settings.
CREATE POLICY "Allow users to view own availability"
ON public.user_service_availability
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

--    Policy 2: Allow users to insert/update their own availability settings.
CREATE POLICY "Allow users to insert/update own availability"
ON public.user_service_availability
FOR ALL -- Covers INSERT and UPDATE (and DELETE if needed, though upsert is common)
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Note: Consider if you need a policy for others to *read* availability (e.g., SELECT for authenticated with USING(true) if public, or more complex logic if restricted).
-- For now, these policies focus on the user managing their *own* settings.

-- Optional: Create an index for faster lookups by user_id
CREATE INDEX IF NOT EXISTS idx_user_service_availability_user_id
ON public.user_service_availability(user_id);
