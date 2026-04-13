import { Bot, Lock, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AIDigitalHumanPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50 px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card className="border-0 shadow-xl">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 p-3 text-white">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">AI数字人</h1>
                  <p className="text-sm text-slate-500">该模块已从当前自建部署版本中临时下线</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>下线说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-600">
            <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-800">
              <Lock className="mt-0.5 h-5 w-5 shrink-0" />
              <p>该功能原先直接依赖 Supabase Storage 和多组 Supabase Functions，尚未迁移到当前自建后端。</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
              <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
              <p>为避免线上出现半可用、半报错状态，当前版本已先关闭入口。后续如需恢复，需要单独补一套自建数字人接口与文件上传链路。</p>
            </div>
            <div className="pt-2">
              <Button asChild>
                <a href="/">返回首页</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
