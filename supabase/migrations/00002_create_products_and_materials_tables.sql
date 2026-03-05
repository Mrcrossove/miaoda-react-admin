-- 创建产品表
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  selling_points text,
  target_audience text,
  image_urls text[] DEFAULT '{}',
  platform text DEFAULT '小红书',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 创建产品素材表
CREATE TABLE public.product_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_type text NOT NULL, -- 'video' 或 'copy'
  title text,
  content text,
  video_url text,
  video_task_id text,
  video_status text, -- 'processing', 'succeed', 'failed'
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;

-- 产品表RLS策略
CREATE POLICY "用户可以查看自己的产品" ON public.products
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的产品" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的产品" ON public.products
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的产品" ON public.products
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 产品素材表RLS策略
CREATE POLICY "用户可以查看自己产品的素材" ON public.product_materials
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_materials.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以创建自己产品的素材" ON public.product_materials
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_materials.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以更新自己产品的素材" ON public.product_materials
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_materials.product_id
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "用户可以删除自己产品的素材" ON public.product_materials
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products
      WHERE products.id = product_materials.product_id
      AND products.user_id = auth.uid()
    )
  );

-- 创建图片存储bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'app-8sm6r7tdrncx_product_images',
  'app-8sm6r7tdrncx_product_images',
  true,
  1048576, -- 1MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
);

-- Bucket存储策略
CREATE POLICY "认证用户可以上传产品图片" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-8sm6r7tdrncx_product_images');

CREATE POLICY "所有人可以查看产品图片" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'app-8sm6r7tdrncx_product_images');

CREATE POLICY "用户可以删除自己的产品图片" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'app-8sm6r7tdrncx_product_images' AND auth.uid()::text = (storage.foldername(name))[1]);