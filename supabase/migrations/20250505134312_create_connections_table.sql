-- Migration: Create connections table and associated RLS policies

-- 1. Create the connections table
CREATE TABLE public.connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    caller_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    receiver_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NULL,
    duration_seconds integer NULL,
    connection_type text NOT NULL,

    -- Constraints
    CONSTRAINT connection_type_check CHECK (connection_type IN ('chat', 'audio', 'video'))
);

-- 2. Add comments
COMMENT ON TABLE public.connections IS 'Logs communication sessions (chat, audio, video) between users.';
COMMENT ON COLUMN public.connections.caller_user_id IS 'User ID of the initiator of the connection.';
COMMENT ON COLUMN public.connections.receiver_user_id IS 'User ID of the recipient of the connection.';
COMMENT ON COLUMN public.connections.start_time IS 'Timestamp when the connection began.';
COMMENT ON COLUMN public.connections.end_time IS 'Timestamp when the connection ended.';
COMMENT ON COLUMN public.connections.duration_seconds IS 'Duration of the connection in seconds (calculated).';
COMMENT ON COLUMN public.connections.connection_type IS 'Type of connection (chat, audio, video).';

-- 3. Create indexes
CREATE INDEX idx_connections_caller_user_id ON public.connections(caller_user_id);
CREATE INDEX idx_connections_receiver_user_id ON public.connections(receiver_user_id);
CREATE INDEX idx_connections_connection_type ON public.connections(connection_type);

-- 4. Enable RLS
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
-- *** SECURITY NOTE: INSERT/UPDATE policies below allow direct client access. ***
-- *** Consider handling writes via Edge Functions for better security. ***

CREATE POLICY "Users can view their own connections"
ON public.connections FOR SELECT TO authenticated
USING (auth.uid() = caller_user_id OR auth.uid() = receiver_user_id);

CREATE POLICY "Users can insert connections they initiate"
ON public.connections FOR INSERT TO authenticated
WITH CHECK (auth.uid() = caller_user_id);

CREATE POLICY "Users can update their own connections (e.g., end_time)"
ON public.connections FOR UPDATE TO authenticated
USING (auth.uid() = caller_user_id OR auth.uid() = receiver_user_id)
WITH CHECK (auth.uid() = caller_user_id OR auth.uid() = receiver_user_id);

-- 6. Grant permissions
-- (Adjust based on security model - remove INSERT/UPDATE grants if using Edge Functions for writes)
GRANT SELECT, INSERT, UPDATE ON TABLE public.connections TO authenticated;
