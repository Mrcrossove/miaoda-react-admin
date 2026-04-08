import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Search, ImageIcon, AlertCircle, ArrowRight, Loader2, Package, X, Copy, Send, Sparkles, ZoomIn, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { searchXiaohongshuNotes } from '@/db/selfHostedApi';
import type { XiaohongshuNote } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import FloatingPlatformButton from '@/components/product-selection/FloatingPlatformButton';
import { sendStreamRequest } from '@/utils/streamRequest';
import { useXHSShare } from '@/hooks/useXHSShare';
import { buildApiUrl } from '@/lib/apiBase';

// 电商平台配置
const E_COMMERCE_PLATFORMS = [
  {
    name: '1688',
    icon: '🏭',
    color: 'from-orange-500 to-red-500',
    url: (keyword: string) => `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(keyword)}`,
    imageSearchUrl: (imageUrl: string) => `https://s.1688.com/youyuan/index.htm?tab=imageSearch&imageType=url&imageAddress=${encodeURIComponent(imageUrl)}`,
    description: '批发拿货',
  },
  {
    name: '淘宝',
    icon: '🛒',
    color: 'from-orange-400 to-orange-600',
    url: (keyword: string) => `https://s.taobao.com/search?q=${encodeURIComponent(keyword)}`,
    imageSearchUrl: (imageUrl: string) => `https://s.taobao.com/search?imgfile=&commend=all&ssid=s5-e&search_type=item&sourceId=tb.index&spm=a21bo.jianhua.201856-taobao-item.1&ie=utf8&initiative_id=tbindexz_20170306&tfsid=&image=${encodeURIComponent(imageUrl)}`,
    description: '零售选品',
  },
  {
    name: '拼多多',
    icon: '🎁',
    color: 'from-red-500 to-pink-500',
    url: (keyword: string) => `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(keyword)}`,
    imageSearchUrl: null, // 拼多多暂不支持以图搜图
    description: '低价货源',
  },
  {
    name: '京东',
    icon: '🐶',
    color: 'from-red-600 to-red-700',
    url: (keyword: string) => `https://search.jd.com/Search?keyword=${encodeURIComponent(keyword)}`,
    imageSearchUrl: null, // 京东暂不支持以图搜图
    description: '品质保障',
  },
];

export default function ProductSelectionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const platform = (location.state as { platform?: string })?.platform || '小红薯';
  
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<XiaohongshuNote[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedNote, setSelectedNote] = useState<XiaohongshuNote | null>(null);
  
  // 图片预览模态框
  const [previewNote, setPreviewNote] = useState<XiaohongshuNote | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // 发布到小红书模态框
  const [publishNote, setPublishNote] = useState<XiaohongshuNote | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  
  // AI二创状态
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const maxTitleLength = 20;
  
  // 小红书分享Hook
  const { shareToXhs } = useXHSShare();

  // 从localStorage恢复状态（只恢复关键词，不恢复搜索结果避免显示过期数据）
  useEffect(() => {
    const savedState = localStorage.getItem('productSelectionState');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        // 只恢复关键词，不恢复搜索结果
        if (state.keyword) {
          setKeyword(state.keyword);
          console.log('已恢复搜索关键词:', state.keyword);
        }
      } catch (error) {
        console.error('恢复状态失败:', error);
      }
    }
  }, []);

  // 保存状态到localStorage（只保存关键词，避免缓存过期数据）
  useEffect(() => {
    if (keyword) {
      const state = {
        keyword,
      };
      localStorage.setItem('productSelectionState', JSON.stringify(state));
    }
  }, [keyword]);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }

    // 清空旧结果，避免显示缓存数据
    setResults([]);
    setLoading(true);
    setHasSearched(true);
    setSelectedNote(null); // 重置选中的笔记
    
    try {
      console.log('开始搜索关键词:', keyword.trim());
      // 使用新参数：number=30(采集30条), sort=4(最多收藏), noteType=2(图文笔记), publishTime=3(半年内)
      const data = await searchXiaohongshuNotes(keyword.trim(), 30, 4, 2, 3);
      
      console.log('搜索结果:', data);
      console.log('返回笔记数量:', data?.data?.notes?.length || 0);
      
      if (data?.data?.notes && Array.isArray(data.data.notes)) {
        setResults(data.data.notes);
        if (data.data.notes.length === 0) {
          toast.info('未找到符合条件的笔记，请尝试其他关键词');
        } else {
          toast.success(`找到 ${data.data.notes.length} 条笔记`);
        }
      } else {
        setResults([]);
        toast.info('未找到符合条件的笔记');
      }
    } catch (error: any) {
      console.error('搜索失败:', error);
      toast.error(error?.message || '搜索失败，请稍后重试');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 10000) {
      return `${(num / 10000).toFixed(1)}w`;
    }
    return num.toLocaleString();
  };

  // 打开图片预览
  const handleImageClick = (note: XiaohongshuNote) => {
    setPreviewNote(note);
    setIsPreviewOpen(true);
  };

  // 打开发布到小红书对话框
  const handlePublishClick = (note: XiaohongshuNote) => {
    setPublishNote(note);
    setEditedTitle(note.title);
    setEditedContent(note.description || '');
    setIsPublishOpen(true);
  };

  // 复制文案
  const handleCopyContent = () => {
    const content = `${editedTitle}\n\n${editedContent}`;
    navigator.clipboard.writeText(content);
    toast.success('文案已复制到剪贴板');
  };

  // 一键发布到小红书
  const handlePublishToXiaohongshu = async () => {
    if (!publishNote) {
      toast.error('未选择笔记');
      return;
    }

    if (!editedTitle || !editedContent) {
      toast.error('请先生成或编辑标题和文案');
      return;
    }

    if (!publishNote.cover_image) {
      toast.error('笔记没有图片');
      return;
    }

    try {
      // 调用小红书JSSDK发布
      await shareToXhs({
        type: 'normal',
        title: editedTitle,
        content: editedContent,
        images: [publishNote.cover_image], // 使用笔记封面图
        fail: (error) => {
          console.error('发布失败:', error);
          toast.error('发布失败，请重试');
        }
      });
      
      // 关闭模态框
      setIsPublishOpen(false);
      toast.success('正在唤起小红书APP...');
    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败，请重试');
    }
  };

  // AI二创文案
  const handleAIRecreate = async () => {
    if (!publishNote) return;

    // 检查标题是否存在
    if (!publishNote.title) {
      toast.error('笔记标题不存在，无法进行AI二创');
      return;
    }

    // 中断之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 创建新的AbortController
    abortControllerRef.current = new AbortController();

    setIsAIGenerating(true);
    setEditedTitle('');
    setEditedContent('');

    let fullContent = '';

    console.log('开始AI二创:', {
      title: publishNote.title,
      hasDescription: !!publishNote.description,
      contentLength: publishNote.description?.length || 0
    });

    try {
      await sendStreamRequest({
        functionUrl: buildApiUrl('/ai-recreate-content'),
        requestBody: {
          originalTitle: publishNote.title,
          originalContent: publishNote.description || undefined
        },
        onData: (data) => {
          try {
            console.log('收到原始数据:', data);
            console.log('数据类型:', typeof data);
            console.log('数据长度:', data.length);
            
            const parsed = JSON.parse(data);
            console.log('解析后的数据:', parsed);
            
            const chunk = parsed.choices?.[0]?.delta?.content || '';
            console.log('提取的chunk:', chunk);
            
            if (chunk) {
              fullContent += chunk;
              console.log('累积内容:', fullContent);
              
              // 解析标题和文案
              const titleMatch = fullContent.match(/标题[：:]\s*(.+?)(?=\n|$)/);
              const contentMatch = fullContent.match(/文案[：:]\s*([\s\S]+)/);
              
              if (titleMatch) {
                const newTitle = titleMatch[1].trim().slice(0, maxTitleLength);
                console.log('匹配到标题:', newTitle);
                setEditedTitle(newTitle);
              }
              
              if (contentMatch) {
                const newContent = contentMatch[1].trim();
                console.log('匹配到文案:', newContent);
                setEditedContent(newContent);
              }
            }
          } catch (e) {
            console.error('解析数据失败:', e);
            console.error('失败的数据:', data);
            console.error('错误堆栈:', e.stack);
          }
        },
        onComplete: () => {
          console.log('AI二创完成');
          setIsAIGenerating(false);
          toast.success('AI二创完成！');
        },
        onError: (error) => {
          console.error('AI二创失败:', error);
          setIsAIGenerating(false);
          toast.error('AI二创失败，请重试');
        },
        signal: abortControllerRef.current.signal
      });
    } catch (error) {
      console.error('AI二创错误:', error);
      setIsAIGenerating(false);
      toast.error('AI二创失败，请重试');
    }
  };

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const openEcommercePlatform = (platformUrl: (keyword: string) => string, platformName: string) => {
    if (!keyword.trim()) {
      toast.error('请先输入搜索关键词');
      return;
    }
    const url = platformUrl(keyword.trim());
    window.open(url, '_blank');
  };

  // 选择笔记进行以图搜图
  const handleSelectNote = (note: XiaohongshuNote) => {
    setSelectedNote(note);
    
  };

  // 以图搜图
  const handleImageSearch = (platform: typeof E_COMMERCE_PLATFORMS[0]) => {
    if (!selectedNote) {
      toast.error('请先选择一个笔记');
      return;
    }

    if (!platform.imageSearchUrl) {
      toast.error(`${platform.name}暂不支持以图搜图功能`);
      return;
    }

    // 保存状态到localStorage（确保跳转后返回时状态不丢失）
    const state = {
      keyword,
      results,
      hasSearched,
      selectedNote,
    };
    localStorage.setItem('productSelectionState', JSON.stringify(state));

    const imageUrl = selectedNote.cover_image;
    const url = platform.imageSearchUrl(imageUrl);
    window.open(url, '_blank');
    
    // 显示详细的操作提示
  };

  // 跳转到"我有产品"页面
  const goToMyProduct = () => {
    navigate('/my-product', { state: { platform } });
  };

  return (
    <div className="container mx-auto p-4 xl:p-6 max-w-7xl pb-24">
      {/* 操作流程提示卡片 */}
      <Card className="mb-6 border-2 border-gradient-purple-blue bg-gradient-to-br from-purple-50 to-blue-50 shadow-colorful">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-purple-blue flex items-center justify-center shrink-0 animate-pulse-scale">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-purple-900 mb-2">💡 选品操作流程</h3>
              <div className="space-y-1.5 text-sm text-purple-800 font-bold">
                <p className="flex items-start gap-2">
                  <span className="font-black shrink-0">1️⃣</span>
                  <span>搜索小红书爆款笔记，浏览产品灵感</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-black shrink-0">2️⃣</span>
                  <span>点击图片放大预览，查看详细内容</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-black shrink-0">3️⃣</span>
                  <span className="font-black text-purple-900">点击"一键发布"，二创文案标题直接发布到小红书</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="font-black shrink-0">4️⃣</span>
                  <span>点击"以图搜图"，在电商平台找到同款货源</span>
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  size="sm"
                  onClick={goToMyProduct}
                  className="bg-gradient-purple-blue hover:scale-105 transition-transform shadow-colorful"
                >
                  <Package className="w-4 h-4 mr-2" />
                  去我有产品
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    localStorage.removeItem('productSelectionState');
                    setKeyword('');
                    setResults([]);
                    setHasSearched(false);
                    setSelectedNote(null);
                  }}
                  className="border-purple-300 text-purple-700 hover:bg-purple-100"
                >
                  清除状态
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 头部 */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold">帮我选品</h1>
            <p className="text-sm text-muted-foreground mt-1">
              搜索{platform}爆款内容，发现热门产品
            </p>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入赛道名称/行业名称/产品名称"
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                搜索中
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                搜索
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          💡 搜索半年内发布的爆款图文笔记（排除视频），按收藏数排序，最多返回30条
        </p>
      </div>

      {/* 以图搜图提示 */}
      {selectedNote && (
        <Card className="mb-6 border-2 border-green-500/50 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                <img
                  src={selectedNote.cover_image}
                  alt={selectedNote.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <ImageIcon className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">已选择笔记</span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{selectedNote.title}</p>
                <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 mb-2">
                  <p className="text-xs text-yellow-900 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      <strong>重要提醒：</strong>跳转到电商平台后，找到商品并<strong className="underline">保存商品图片到相册</strong>，然后返回本应用继续选品或去"我有产品"上传
                    </span>
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  点击下方平台按钮，使用此笔记的图片进行以图搜图
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNote(null)}
                className="shrink-0"
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 电商拿货平台 */}
      {keyword.trim() && (
        <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-lg">
                {selectedNote ? '以图搜图找货源' : '电商拿货平台'}
              </h3>
              <span className="text-xs text-muted-foreground ml-auto">
                {selectedNote ? '使用笔记图片搜索同款' : `一键查看"${keyword}"的商品货源`}
              </span>
            </div>
            
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {E_COMMERCE_PLATFORMS.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => selectedNote ? handleImageSearch(platform) : openEcommercePlatform(platform.url, platform.name)}
                  disabled={selectedNote !== null && !platform.imageSearchUrl}
                  className={`group relative overflow-hidden rounded-lg border-2 ${
                    selectedNote && !platform.imageSearchUrl 
                      ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' 
                      : 'border-border hover:border-primary/50 bg-card hover:shadow-lg hover:scale-105 active:scale-95'
                  } p-4 transition-all`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${platform.color} flex items-center justify-center text-2xl shadow-lg ${
                      selectedNote && !platform.imageSearchUrl ? '' : 'group-hover:scale-110'
                    } transition-transform`}>
                      {platform.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{platform.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedNote && platform.imageSearchUrl ? '以图搜图' : platform.description}
                      </div>
                    </div>
                  </div>
                  {selectedNote && platform.imageSearchUrl && (
                    <ImageIcon className="absolute top-2 right-2 w-4 h-4 text-green-600" />
                  )}
                </button>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
              <Package className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                {selectedNote ? (
                  <>
                    <strong>以图搜图：</strong>
                    1688和淘宝支持以图搜图功能，可以快速找到同款或相似商品。选择笔记后点击平台按钮即可跳转。
                  </>
                ) : (
                  <>
                    <strong>拿货建议：</strong>
                    1688适合批量拿货，淘宝适合小批量测试，拼多多价格最优，京东品质保障。建议对比多个平台的价格和质量后再决定。
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 结果列表 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full bg-muted" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-full bg-muted" />
                <Skeleton className="h-4 w-3/4 bg-muted" />
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16 bg-muted" />
                  <Skeleton className="h-4 w-16 bg-muted" />
                  <Skeleton className="h-4 w-16 bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((note) => (
            <Card 
              key={note.note_id} 
              className={`overflow-hidden hover:shadow-heavy transition-all group border-2 ${
                selectedNote?.note_id === note.note_id ? 'border-gold shadow-gold' : 'border-transparent hover:border-primary'
              }`}
            >
              {/* 封面图 */}
              <div 
                className="aspect-[4/3] relative overflow-hidden bg-muted cursor-pointer group"
                onClick={() => handleImageClick(note)}
              >
                <img
                  src={note.cover_image}
                  alt={note.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
                {/* 放大图标提示 */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center animate-pulse-scale">
                    <ZoomIn className="w-8 h-8 text-white" />
                  </div>
                </div>
                {/* 已选择标记 */}
                {selectedNote?.note_id === note.note_id && (
                  <div className="absolute top-2 left-2 bg-gradient-gold text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-gold font-black animate-pulse-scale">
                    <ImageIcon className="w-3 h-3" />
                    已选择
                  </div>
                )}
              </div>

              <CardContent className="p-4 space-y-3">
                {/* 标题 */}
                <h3 className="font-black line-clamp-2 text-base">
                  {note.title}
                </h3>

                {/* 描述 */}
                {note.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 font-bold">
                    {note.description}
                  </p>
                )}

                {/* 作者信息 */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {note.author_avatar && (
                    <img
                      src={note.author_avatar}
                      alt={note.author_name}
                      className="w-6 h-6 rounded-full"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="text-xs text-muted-foreground truncate font-bold">
                    {note.author_name}
                  </span>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="flex-1 bg-gradient-purple-blue hover:scale-105 transition-transform shadow-colorful font-black"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePublishClick(note);
                    }}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    一键发布
                  </Button>
                  <Button
                    variant={selectedNote?.note_id === note.note_id ? "default" : "outline"}
                    size="sm"
                    className={`flex-1 font-black ${
                      selectedNote?.note_id === note.note_id 
                        ? 'bg-gradient-gold hover:scale-105 transition-transform shadow-gold' 
                        : 'border-2 hover:border-gold'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectNote(note);
                    }}
                  >
                    <ImageIcon className="w-4 h-4 mr-2" />
                    {selectedNote?.note_id === note.note_id ? '已选择' : '以图搜图'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : hasSearched ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">未找到符合条件的笔记</p>
            <p className="text-sm text-muted-foreground mb-4">
              请尝试其他关键词，或降低筛选条件
            </p>
            <Button variant="outline" onClick={() => setKeyword('')}>
              重新搜索
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Search className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">开始搜索爆款内容</p>
            <p className="text-sm text-muted-foreground">
              输入赛道、行业或产品名称，发现热门笔记
            </p>
          </CardContent>
        </Card>
      )}

      {/* 悬浮平台选择按钮 */}
      <FloatingPlatformButton
        platforms={E_COMMERCE_PLATFORMS}
        selectedImageUrl={selectedNote?.cover_image || null}
        keyword={keyword}
        onPlatformSelect={handleImageSearch}
      />

      {/* 图片预览模态框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black">{previewNote?.title}</DialogTitle>
            <DialogDescription className="text-sm font-bold">
              作者：{previewNote?.author_name}
            </DialogDescription>
          </DialogHeader>
          
          {previewNote && (
            <div className="space-y-4">
              {/* 图片 */}
              <div className="relative rounded-2xl overflow-hidden shadow-heavy">
                <img
                  src={previewNote.cover_image}
                  alt={previewNote.title}
                  className="w-full h-auto"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>

              {/* 文案内容 */}
              {previewNote.description && (
                <div className="p-4 bg-muted rounded-2xl">
                  <h4 className="font-black text-sm mb-2">📝 笔记文案</h4>
                  <p className="text-sm whitespace-pre-wrap font-bold">{previewNote.description}</p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-gradient-purple-blue hover:scale-105 transition-transform shadow-colorful font-black"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handlePublishClick(previewNote);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  一键发布到小红书
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-2 hover:border-gold font-black"
                  onClick={() => {
                    setIsPreviewOpen(false);
                    handleSelectNote(previewNote);
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  以图搜图
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 发布到小红书模态框 */}
      <Dialog open={isPublishOpen} onOpenChange={setIsPublishOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary animate-bounce-soft" />
              二创发布到小红书
            </DialogTitle>
            <DialogDescription className="text-sm font-bold">
              编辑标题和文案，一键复制并发布到小红书创作平台
            </DialogDescription>
          </DialogHeader>
          
          {publishNote && (
            <div className="space-y-4">
              {/* 原图预览 */}
              <div className="relative rounded-2xl overflow-hidden shadow-heavy max-h-60">
                <img
                  src={publishNote.cover_image}
                  alt={publishNote.title}
                  className="w-full h-auto object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              </div>

              {/* AI二创按钮 */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="outline"
                  className="flex-1 border-2 border-purple-300 hover:border-purple-500 font-black"
                  onClick={handleAIRecreate}
                  disabled={isAIGenerating}
                >
                  {isAIGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI创作中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      AI智能二创
                    </>
                  )}
                </Button>
              </div>

              {/* 编辑标题 */}
              <div className="space-y-2">
                <label className="text-sm font-black flex items-center gap-2">
                  📌 标题
                  <span className="text-xs text-muted-foreground font-bold">({editedTitle.length}/{maxTitleLength})</span>
                </label>
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value.slice(0, maxTitleLength))}
                  placeholder="输入标题"
                  className="font-bold"
                  maxLength={maxTitleLength}
                />
              </div>

              {/* 编辑文案 */}
              <div className="space-y-2">
                <label className="text-sm font-black flex items-center gap-2">
                  ✍️ 文案内容
                  <span className="text-xs text-muted-foreground font-bold">({editedContent.length}字)</span>
                </label>
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  placeholder="输入文案内容"
                  className="min-h-[200px] font-bold"
                />
              </div>

              {/* 提示信息 */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl border-2 border-purple-200">
                <p className="text-sm font-black text-purple-900 mb-2">💡 一键发布流程：</p>
                <ol className="text-xs text-purple-800 space-y-1 font-bold">
                  <li>1. 点击"AI智能二创"按钮，自动生成爆款标题和完整文案</li>
                  <li>2. 可手动编辑优化生成的内容</li>
                  <li>3. 点击"一键发布"后，自动唤起小红书APP</li>
                  <li>4. 标题、文案和图片自动填充，在小红书中点击"发布"即可完成</li>
                </ol>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-2 font-black"
                  onClick={handleCopyContent}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  复制文案
                </Button>
                <Button
                  className="flex-1 bg-gradient-purple-blue hover:scale-105 transition-transform shadow-colorful font-black"
                  onClick={handlePublishToXiaohongshu}
                >
                  <Send className="w-4 h-4 mr-2" />
                  一键发布
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
