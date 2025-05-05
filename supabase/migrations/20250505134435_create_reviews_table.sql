-- Migration: Create reviews table and associated RLS policies

-- 1. Create the reviews table
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewer_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reviewed_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating smallint NOT NULL,
    review_text text NULL, -- Optional text review

    -- Constraints
    CONSTRAINT rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviewer_ne_reviewed_check CHECK ((reviewer_user_id <> reviewed_user_id)),
    CONSTRAINT unique_review_per_pair UNIQUE (reviewer_user_id, reviewed_user_id) -- Optional: Remove if multiple reviews per pair are allowed
);

-- 2. Add comments
COMMENT ON TABLE public.reviews IS 'Stores ratings and reviews given by users to other users.';
COMMENT ON COLUMN public.reviews.reviewer_user_id IS 'The user ID of the person writing the review.';
COMMENT ON COLUMN public.reviews.reviewed_user_id IS 'The user ID of the person being reviewed.';
COMMENT ON COLUMN public.reviews.rating IS 'Numerical rating, typically 1 to 5.';
COMMENT ON COLUMN public.reviews.review_text IS 'Optional textual comment for the review.';

-- 3. Create indexes
CREATE INDEX idx_reviews_reviewer_user_id ON public.reviews(reviewer_user_id);
CREATE INDEX idx_reviews_reviewed_user_id ON public.reviews(reviewed_user_id);

-- 4. Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 5. Define RLS Policies
CREATE POLICY "Users can insert their own reviews"
ON public.reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE TO authenticated
USING (auth.uid() = reviewer_user_id) WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE TO authenticated
USING (auth.uid() = reviewer_user_id);

CREATE POLICY "Authenticated users can view all reviews"
ON public.reviews FOR SELECT TO authenticated
USING (true); -- Adjust if stricter view permissions needed

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO authenticated;
