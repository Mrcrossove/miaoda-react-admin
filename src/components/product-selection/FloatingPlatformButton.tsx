import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Package, X } from 'lucide-react';
import { toast } from 'sonner';

interface Platform {
  name: string;
  icon: string;
  color: string;
  url: (keyword: string) => string;
  imageSearchUrl: ((imageUrl: string) => string) | null;
  description: string;
  appScheme?: string; // APP URL Scheme
}

interface FloatingPlatformButtonProps {
  platforms: Platform[];
  selectedImageUrl: string | null;
  keyword: string;
  onPlatformSelect: (platform: Platform) => void;
}

export default function FloatingPlatformButton({
  platforms,
  selectedImageUrl,
  keyword,
  onPlatformSelect,
}: FloatingPlatformButtonProps) {
  const [open, setOpen] = useState(false);

  // 只在选择了图片时显示悬浮按钮
  if (!selectedImageUrl) {
    return null;
  }

  const handlePlatformClick = (platform: Platform) => {
    onPlatformSelect(platform);
    setOpen(false);
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="fixed bottom-24 right-4 xl:bottom-8 xl:right-8 z-50 h-14 px-6 rounded-full shadow-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold animate-bounce"
          >
            <Package className="w-5 h-5 mr-2" />
            以图搜货源
          </Button>
        </SheetTrigger>

        {/* 平台选择面板 */}
        <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
          <SheetHeader className="mb-6">
            <SheetTitle className="text-xl font-bold text-center">
              选择电商平台
            </SheetTitle>
            <p className="text-sm text-muted-foreground text-center">
              使用笔记图片在以下平台搜索同款货源
            </p>
          </SheetHeader>

          {/* 已选择的图片预览 */}
          {selectedImageUrl && (
            <div className="mb-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-500/30">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                  <img
                    src={selectedImageUrl}
                    alt="已选择"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-700 mb-1">
                    ✓ 已选择图片
                  </p>
                  <p className="text-xs text-muted-foreground">
                    点击下方平台按钮进行以图搜图
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 平台列表 */}
          <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[calc(70vh-280px)] pb-6">
            {platforms.map((platform) => {
              const isDisabled = !platform.imageSearchUrl;
              
              return (
                <button
                  key={platform.name}
                  onClick={() => !isDisabled && handlePlatformClick(platform)}
                  disabled={isDisabled}
                  className={`
                    relative p-6 rounded-2xl border-2 transition-all duration-200
                    ${isDisabled 
                      ? 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed' 
                      : 'bg-gradient-to-br border-transparent hover:scale-105 hover:shadow-xl active:scale-95'
                    }
                    ${!isDisabled && `bg-gradient-to-br ${platform.color}`}
                  `}
                >
                  {/* 平台图标 */}
                  <div className="text-5xl mb-3 text-center">
                    {platform.icon}
                  </div>
                  
                  {/* 平台名称 */}
                  <div className="text-center">
                    <p className={`font-bold text-lg mb-1 ${isDisabled ? 'text-gray-500' : 'text-white'}`}>
                      {platform.name}
                    </p>
                    <p className={`text-xs ${isDisabled ? 'text-gray-400' : 'text-white/90'}`}>
                      {platform.description}
                    </p>
                  </div>

                  {/* 不支持标识 */}
                  {isDisabled && (
                    <div className="absolute top-2 right-2 bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                      暂不支持
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* 提示信息 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 text-center">
              💡 提示：点击平台后将在新窗口打开以图搜图页面
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
