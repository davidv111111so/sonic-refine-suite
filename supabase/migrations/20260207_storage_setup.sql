-- 1. Create the bucket (with public access for easy processing)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-processing', 'audio-processing', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow all users (including anon/dev) to upload to this temporary bucket
-- Since files are automatically purged after 1 hour, we allow this for simplicity in AI processing.
CREATE POLICY "Allow uploads for processing"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'audio-processing');

-- 3. Allow all users to read files (required for backend to download)
CREATE POLICY "Allow read for processing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'audio-processing');

-- 4. Allow service role (backend) full access for cleanup and management
CREATE POLICY "Service role full access"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'audio-processing')
WITH CHECK (bucket_id = 'audio-processing');
