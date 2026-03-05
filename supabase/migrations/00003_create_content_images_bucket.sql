-- 创建图文创作图片存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-8sm6r7tdrncx_content_images', 'app-8sm6r7tdrncx_content_images', true)
ON CONFLICT (id) DO NOTHING;

-- 允许所有用户上传图片
CREATE POLICY "允许所有用户上传图片"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'app-8sm6r7tdrncx_content_images');

-- 允许所有用户查看图片
CREATE POLICY "允许所有用户查看图片"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'app-8sm6r7tdrncx_content_images');

-- 允许所有用户删除自己上传的图片
CREATE POLICY "允许所有用户删除图片"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'app-8sm6r7tdrncx_content_images');
