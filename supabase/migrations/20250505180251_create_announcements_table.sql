-- Migration: Create announcements table for various types

-- 1. Create the announcements table
CREATE TABLE public.announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL CHECK (type IN ('text', 'link', 'image', 'button')),
    image_url text NULL,
    link_url text NULL,
    button_text text NULL,
    button_action_type text NULL CHECK (button_action_type IN ('url', 'navigate')),
    button_action_target text NULL,
    publish_at timestamp with time zone DEFAULT timezone('utc'::text, now()), -- Defaults to publish immediately
    expires_at timestamp with time zone NULL,

    -- Ensure button fields are present if type is 'button' (optional but good practice)
    CONSTRAINT button_fields_check CHECK (
        (type <> 'button') OR
        (type = 'button' AND button_text IS NOT NULL AND button_action_type IS NOT NULL AND button_action_target IS NOT NULL)
    ),
    -- Ensure image_url is present if type is 'image'
    CONSTRAINT image_url_check CHECK ( (type <> 'image') OR (type = 'image' AND image_url IS NOT NULL) ),
     -- Ensure link_url is present if type is 'link'
    CONSTRAINT link_url_check CHECK ( (type <> 'link') OR (type = 'link' AND link_url IS NOT NULL) )
);

-- 2. Add comments
COMMENT ON TABLE public.announcements IS 'Stores admin announcements for users, supporting different formats.';
COMMENT ON COLUMN public.announcements.type IS 'Type of announcement (text, link, image, button).';
COMMENT ON COLUMN public.announcements.image_url IS 'URL for the image (if type is image).';
COMMENT ON COLUMN public.announcements.link_url IS 'URL for the link (if type is link).';
COMMENT ON COLUMN public.announcements.button_text IS 'Text displayed on the button (if type is button).';
COMMENT ON COLUMN public.announcements.button_action_type IS 'Action for the button: url or navigate (if type is button).';
COMMENT ON COLUMN public.announcements.button_action_target IS 'Target URL or screen name for the button action (if type is button).';
COMMENT ON COLUMN public.announcements.publish_at IS 'Timestamp when the announcement should become visible.';
COMMENT ON COLUMN public.announcements.expires_at IS 'Timestamp when the announcement should no longer be visible.';

-- 3. Create indexes
CREATE INDEX idx_announcements_publish_at ON public.announcements(publish_at DESC); -- For fetching active announcements
CREATE INDEX idx_announcements_type ON public.announcements(type);

-- 4. Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
-- Allow all authenticated users to SELECT active announcements
CREATE POLICY "Allow authenticated users to view active announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
    (publish_at <= timezone('utc'::text, now())) -- Published
    AND
    (expires_at IS NULL OR expires_at > timezone('utc'::text, now())) -- Not expired
);

-- Restrict INSERT/UPDATE/DELETE (assuming handled by admin/backend)
-- Example: Allow admin role (if you have one)
-- CREATE POLICY "Allow admin users to manage announcements"
-- ON public.announcements
-- FOR ALL
-- TO authenticated -- Or a specific admin role
-- USING (check_user_role('admin')) -- Replace with your role check function
-- WITH CHECK (check_user_role('admin'));

-- 6. Grant SELECT permission
GRANT SELECT ON TABLE public.announcements TO authenticated;
-- Grant INSERT/UPDATE/DELETE to service_role implicitly, or specific admin roles if needed.
