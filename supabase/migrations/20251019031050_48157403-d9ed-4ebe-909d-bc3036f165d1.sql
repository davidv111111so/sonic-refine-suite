-- Create storage bucket for mastered audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mastered-audio',
  'mastered-audio',
  true,
  104857600, -- 100MB limit
  ARRAY['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for mastered audio
CREATE POLICY "Users can view their own mastered audio"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'mastered-audio' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR auth.role() = 'authenticated')
);

CREATE POLICY "Users can upload their own mastered audio"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'mastered-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own mastered audio"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'mastered-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own mastered audio"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'mastered-audio' AND
  auth.uid()::text = (storage.foldername(name))[1]
);