-- Migration to set up storage for audio processing
-- This creates the bucket and sets up RLS policies

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-processing', 'audio-processing', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload their own audio"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'audio-processing' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Allow authenticated users to read their own files
CREATE POLICY "Users can view their own audio"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'audio-processing' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Allow service role (backend) full access
CREATE POLICY "Service role has full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'audio-processing')
WITH CHECK (bucket_id = 'audio-processing');

-- 5. Public read access (Optional, but useful if using getPublicUrl)
-- If we want strict security, we'd use signed URLs and remove this.
-- Given the 'publicUrl' call in frontend, we make it public for now.
CREATE POLICY "Public read access for audio-processing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-processing');
