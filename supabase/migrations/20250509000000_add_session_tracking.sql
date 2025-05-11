-- Create an enum for session types
CREATE TYPE session_type AS ENUM ('chat', 'call', 'video');

-- Create table for tracking session times
CREATE TABLE session_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    listener_id UUID NOT NULL REFERENCES auth.users(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    session_type session_type NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT different_users CHECK (listener_id != user_id)
);

-- Add index for faster queries
CREATE INDEX idx_session_logs_listener_id ON session_logs(listener_id);
CREATE INDEX idx_session_logs_user_id ON session_logs(user_id);

-- Add function to calculate total hours spent for a listener
CREATE OR REPLACE FUNCTION calculate_listener_hours(listener_uuid UUID)
RETURNS FLOAT
LANGUAGE plpgsql
AS $$
DECLARE
    total_hours FLOAT;
BEGIN
    SELECT COALESCE(SUM(duration_minutes) / 60.0, 0)
    INTO total_hours
    FROM session_logs
    WHERE listener_id = listener_uuid
    AND duration_minutes IS NOT NULL;
    
    RETURN total_hours;
END;
$$;

-- Add column for total_hours_spent in user_preferences
ALTER TABLE user_preferences
ADD COLUMN total_hours_spent FLOAT DEFAULT 0;

-- Create function to update session duration
CREATE OR REPLACE FUNCTION update_session_duration()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
        -- Calculate duration in minutes
        NEW.duration_minutes := EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
        
        -- Update total_hours_spent for the listener
        UPDATE user_preferences
        SET 
            total_hours_spent = calculate_listener_hours(NEW.listener_id),
            updated_at = NOW()
        WHERE user_id = NEW.listener_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Create trigger for updating session duration
CREATE TRIGGER update_session_duration_trigger
BEFORE UPDATE ON session_logs
FOR EACH ROW
EXECUTE FUNCTION update_session_duration();

-- Function to start a new session
CREATE OR REPLACE FUNCTION start_user_session(
    p_listener_id UUID,
    p_user_id UUID,
    p_session_type session_type
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    new_session_id UUID;
BEGIN
    INSERT INTO session_logs (listener_id, user_id, session_type)
    VALUES (p_listener_id, p_user_id, p_session_type)
    RETURNING id INTO new_session_id;
    
    RETURN new_session_id;
END;
$$;

-- Function to end a session
CREATE OR REPLACE FUNCTION end_user_session(p_session_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE session_logs
    SET 
        end_time = NOW(),
        updated_at = NOW()
    WHERE id = p_session_id
    AND end_time IS NULL;
    
    RETURN FOUND;
END;
$$; 