import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Package, Plus, Sparkles, FileText, Loader2, Image as ImageIcon, Video, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { ImageUpload } from '@/components/common/ImageUpload';
import { sendStreamRequest } from '@/utils/stream';
import { createProduct, getUserProducts } from '@/db/selfHostedApi';
import { buildApiUrl } from '@/lib/apiBase';
import type { Product } from '@/types';
import { useXHSShare } from '@/hooks/useXHSShare';
import { getUserIdFromStorage, isValidUUID } from '@/utils/uuid';
import { filterContentLabels, separateTitleAndBody } from '@/utils/contentFilter';

export default function MyProductPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const platform = (location.state as { platform?: string })?.platform || '小红薯';
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selling_points: '',
    target_audience: '',
    image_urls: [] as string[],
  });

  // 生成状态
  const [generating, setGenerating] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState('');
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // 小红书分享Hook
  const { shareToXhs, isSDKLoaded } = useXHSShare();

  // 获取用户ID（Supabase Auth）
  useEffect(() => {
    if (user?.id && isValidUUID(user.id)) {
      console.log('[MyProductPage] 使用Supabase认证用户ID:', user.id);
      setUserId(user.id);
      return;
    }

    console.warn('[MyProductPage] 未获取到有效的用户ID');
    const storedUserId = getUserIdFromStorage();
    if (storedUserId) {
      console.log('[MyProductPage] 使用本地账号用户ID:', storedUserId);
      setUserId(storedUserId);
      return;
    }

    setUserId(null);
  }, [user]);

  // 加载产品列表
  useEffect(() => {
    if (userId) {
      loadProducts();
    }
  }, [userId]);

  const loadProducts = async () => {
    if (!userId || !isValidUUID(userId)) {
      console.error('[MyProductPage] 用户ID无效，无法加载产品:', userId);
      toast.error('用户信息无效，请重新登录');
      return;
    }
    
    try {
      setLoading(true);
      const data = await getUserProducts(userId);
      setProducts(data || []);
    } catch (error) {
      console.error('加载产品失败:', error);
      toast.error('加载产品失败');
    } finally {
      setLoading(false);
    }
  };

  // 计算剩余时间
  const getRemainingTime = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const expiresAt = new Date(created.getTime() + 72 * 60 * 60 * 1000); // 72小时后
    const remaining = expiresAt.getTime() - now.getTime();

    if (remaining <= 0) {
      return '已过期';
    }

    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `剩余 ${days}天${remainingHours}小时`;
    } else if (hours > 0) {
      return `剩余 ${hours}小时${minutes}分钟`;
    } else {
      return `剩余 ${minutes}分钟`;
    }
  };

  // 处理图片上传
  const handleImageUpload = (urls: string[]) => {
    setFormData(prev => ({
      ...prev,
      image_urls: urls
    }));
  };

  // 创建产品
  const handleCreateProduct = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入产品名称');
      return;
    }

    if (formData.image_urls.length === 0) {
      toast.error('请至少上传一张产品图片');
      return;
    }

    if (!userId || !isValidUUID(userId)) {
      console.error('[MyProductPage] 用户ID无效，无法创建产品:', userId);
      toast.error('用户信息无效，请重新登录');
      return;
    }

    try {
      const product = await createProduct({
        name: formData.name,
        description: formData.description || null,
        selling_points: formData.selling_points || null,
        target_audience: formData.target_audience || null,
        image_urls: formData.image_urls,
        user_id: userId,
        platform: platform,
      });

      if (product) {
        
        setShowCreateDialog(false);
        setFormData({
          name: '',
          description: '',
          selling_points: '',
          target_audience: '',
          image_urls: [],
        });
        loadProducts();
      }
    } catch (error) {
      console.error('创建产品失败:', error);
      toast.error('创建产品失败');
    }
  };

  // 生成素材
  const handleGenerateMaterials = async (product: Product) => {
    setSelectedProduct(product);
    setShowGenerateDialog(true);
    setGeneratedCopy('');
    
    // 自动开始生成文案
    await generateCopy(product);
  };

  // 跳转到图片工厂
  const handleGoToImageFactory = (product: Product) => {
    // 跳转到图片工厂页面，并传递产品名称作为核心主题
    navigate('/image-factory', {
      state: {
        platform,
        coreTheme: product.name, // 将产品名称作为核心主题传递
        fromMyProduct: true, // 标记来源
      }
    });
    
  };

  // 跳转到电商视频
  const handleGoToEcommerceVideo = (product: Product) => {
    // 跳转到电商视频页面，并传递产品图片和产品名称
    navigate('/ecommerce-video', {
      state: {
        platform,
        productImages: product.image_urls, // 传递产品图片数组
        productName: product.name, // 传递产品名称
        fromMyProduct: true, // 标记来源
      }
    });
    
  };

  // 生成文案
  const generateCopy = async (product: Product) => {
    if (generating) {
      toast.warning('文案正在生成中，请稍候');
      return;
    }

    setGenerating(true);
    setGeneratedCopy('');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      let fullContent = '';

      await sendStreamRequest({
        functionUrl: buildApiUrl('/generate-xiaohongshu-copy'),
        requestBody: {
          productName: product.name,
          sellingPoints: product.selling_points,
          targetAudience: product.target_audience,
          description: product.description,
        },
        onData: (data) => {
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.content || '';
            fullContent += chunk;
            setGeneratedCopy(fullContent);
          } catch (e) {
            console.warn('解析数据失败:', e);
          }
        },
        onComplete: () => {
          // 去除特殊符号
          let cleanedContent = fullContent.replace(/[*#]/g, '');
          // 应用AI文案内容过滤系统，移除【标题】、【正文】等标识
          cleanedContent = filterContentLabels(cleanedContent);
          setGeneratedCopy(cleanedContent);
          setGenerating(false);
          
        },
        onError: (error) => {
          console.error('生成文案失败:', error);
          toast.error('生成文案失败');
          setGenerating(false);
        },
        signal: abortController.signal,
      });
    } catch (error) {
      console.error('生成文案失败:', error);
      toast.error('生成文案失败');
      setGenerating(false);
    }
  };

  // 发布到小红书
  const handlePublishToXhs = async () => {
    if (!selectedProduct) {
      toast.error('未选择产品');
      return;
    }

    if (!generatedCopy) {
      toast.error('请先生成文案');
      return;
    }

    if (!selectedProduct.image_urls || selectedProduct.image_urls.length === 0) {
      toast.error('产品没有图片');
      return;
    }

    try {
      // 从生成的文案中分离标题和正文
      const { title, body } = separateTitleAndBody(generatedCopy);
      
      // 如果没有标题，使用产品名称作为备用
      const finalTitle = title || selectedProduct.name;
      // 如果没有正文，使用完整文案
      const finalContent = body || generatedCopy;
      
      // 产品图片已经是Supabase URL，可以直接使用
      await shareToXhs({
        type: 'normal',
        title: finalTitle,
        content: finalContent,
        images: selectedProduct.image_urls,
        fail: (error) => {
          console.error('发布失败:', error);
          toast.error('发布失败，请重试');
        }
      });
    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败，请重试');
    }
  };

  return (
    <div className="container mx-auto p-4 xl:p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold">我有产品</h1>
          <p className="text-sm text-muted-foreground mt-1">
            上传产品图片，生成{platform}爆款文案
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              上传产品图片
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>添加新产品</DialogTitle>
              <DialogDescription>
                填写产品信息，上传产品图片
              </DialogDescription>
            </DialogHeader>
            
            {/* 过期提示 */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-sm text-orange-800">
                ⏰ <strong>重要提示：</strong>产品信息将在上传后<strong>72小时</strong>自动删除，请及时生成文案并发布。
              </p>
            </div>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">产品名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入产品名称"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">产品描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简要描述产品特点"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="selling_points">核心卖点</Label>
                <Textarea
                  id="selling_points"
                  value={formData.selling_points}
                  onChange={(e) => setFormData({ ...formData, selling_points: e.target.value })}
                  placeholder="产品的核心卖点和优势"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_audience">目标用户</Label>
                <Input
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  placeholder="例如：25-35岁女性"
                />
              </div>
              <div className="space-y-2">
                <Label>产品图片 *</Label>
                <ImageUpload
                  value={formData.image_urls}
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-muted-foreground">
                  最多上传9张图片
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                取消
              </Button>
              <Button onClick={handleCreateProduct}>
                创建产品
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">还没有产品，快来添加第一个产品吧</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              添加产品
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="p-0">
                {product.image_urls && product.image_urls.length > 0 && (
                  <div className="aspect-square bg-muted">
                    <img
                      src={product.image_urls[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-1">{product.name}</h3>
                  {product.selling_points && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {product.selling_points}
                    </p>
                  )}
                  {/* 显示剩余时间 */}
                  <p className="text-xs text-orange-600 mt-2">
                    ⏰ {getRemainingTime(product.created_at)}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleGenerateMaterials(product)}
                      className="flex-1"
                      size="sm"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      生成{platform}文案
                    </Button>
                    <Button
                      onClick={() => handleGoToImageFactory(product)}
                      variant="outline"
                      className="flex-1"
                      size="sm"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      批量生图
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleGoToEcommerceVideo(product)}
                    variant="secondary"
                    className="w-full"
                    size="sm"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    电商视频
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* 生成素材对话框 */}
      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>生成{platform}文案</DialogTitle>
            <DialogDescription>
              {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* 产品图片预览 */}
            {selectedProduct && selectedProduct.image_urls.length > 0 && (
              <div className="space-y-2">
                <Label>产品图片</Label>
                <div className="grid grid-cols-3 gap-2">
                  {selectedProduct.image_urls.map((url, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={url}
                        alt={`${selectedProduct.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 文案内容 */}
            <div className="space-y-2">
              <Label>生成的文案</Label>
              {generating && !generatedCopy ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : generatedCopy ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted min-h-[200px]">
                    <pre className="whitespace-pre-wrap text-sm font-sans">
                      {generatedCopy}
                    </pre>
                  </div>
                  <Button
                    onClick={handlePublishToXhs}
                    disabled={!isSDKLoaded}
                    className="w-full"
                  >
                    {!isSDKLoaded ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        SDK初始化中...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        发布到小红书
                      </>
                    )}
                  </Button>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                    <p className="text-sm font-semibold text-blue-900">
                      💡 一键发布流程
                    </p>
                    <p className="text-xs text-blue-700">
                      点击"发布到小红书"后：<br />
                      1️⃣ 自动唤起小红书APP<br />
                      2️⃣ 自动填充产品图片和文案<br />
                      3️⃣ 在小红书中点击"发布"即可完成
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无文案</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
