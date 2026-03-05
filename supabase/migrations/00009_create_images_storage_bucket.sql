
-- 创建images存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- 创建公开访问策略
CREATE POLICY "Public Access for images bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- 创建上传策略（允许所有人上传）
CREATE POLICY "Allow public uploads to images bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- 创建删除策略（允许所有人删除）
CREATE POLICY "Allow public deletes from images bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');
