import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, CheckCircle2, Film, Gavel, Loader2, Mic, Sparkles, Upload, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { isValidUUID } from '@/utils/uuid';
import {
  getDigitalHumanHotCopies,
  queryDigitalHumanJob,
  reviewDigitalHumanCopy,
  rewriteDigitalHumanCopy,
  submitDigitalHumanJob,
  uploadDigitalHumanAsset,
  type DigitalHumanHotCopy,
  type DigitalHumanJobResult,
  type DigitalHumanLegalReviewResult,
  type DigitalHumanRewriteVersion,
} from '@/db/digitalHumanApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

const STEPS = [
  { id: 1, label: '行业爆款', icon: Sparkles },
  { id: 2, label: '仿写脚本', icon: Wand2 },
  { id: 3, label: '法务审查', icon: Gavel },
  { id: 4, label: '素材上传', icon: Upload },
  { id: 5, label: '任务结果', icon: Film },
] as const;

export default function AIDigitalHumanPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const pollRef = useRef<number | null>(null);

  const [industry, setIndustry] = useState('美业');
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingHotCopies, setLoadingHotCopies] = useState(false);
  const [loadingRewrite, setLoadingRewrite] = useState(false);
  const [loadingReview, setLoadingReview] = useState(false);
  const [submittingJob, setSubmittingJob] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<'avatar' | 'voice' | null>(null);

  const [sessionId, setSessionId] = useState('');
  const [rewriteId, setRewriteId] = useState('');
  const [reviewId, setReviewId] = useState('');
  const [hotCopies, setHotCopies] = useState<DigitalHumanHotCopy[]>([]);
  const [selectedCopyIndex, setSelectedCopyIndex] = useState<number | null>(null);
  const [rewriteVersions, setRewriteVersions] = useState<DigitalHumanRewriteVersion[]>([]);
  const [selectedRewriteIndex, setSelectedRewriteIndex] = useState<number | null>(null);
  const [reviewResult, setReviewResult] = useState<DigitalHumanLegalReviewResult | null>(null);
  const [reviewedScript, setReviewedScript] = useState('');
  const [coverTitle, setCoverTitle] = useState('美业老板IP爆款口播');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [voiceSampleUrl, setVoiceSampleUrl] = useState('');
  const [jobResult, setJobResult] = useState<DigitalHumanJobResult | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user?.id || !isValidUUID(user.id)) {
      navigate('/login', { state: { from: '/ai-digital-human' }, replace: true });
    }
  }, [authLoading, navigate, user]);

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, []);

  const selectedCopy = selectedCopyIndex !== null ? hotCopies[selectedCopyIndex] : null;
  const selectedRewrite = selectedRewriteIndex !== null ? rewriteVersions[selectedRewriteIndex] : null;
  const canGenerateJob = Boolean(reviewedScript.trim() && avatarUrl && voiceSampleUrl && rewriteId && reviewId);

  const userId = user?.id ?? '';

  const progressLabel = useMemo(() => {
    if (!jobResult) return '等待创建任务';
    return `${jobResult.status} / ${jobResult.step ?? 'pending'}`;
  }, [jobResult]);

  const startPolling = (jobId: string) => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
    }

    pollRef.current = window.setInterval(async () => {
      try {
        const result = await queryDigitalHumanJob(jobId);
        setJobResult(result);

        if (result.status === 'completed' || result.status === 'failed' || result.status === 'cancelled') {
          if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
          }

          if (result.status === 'completed') {
            toast.success('Mock 数字人视频已生成完成');
          } else {
            toast.error(result.error_message || '数字人任务失败');
          }
        }
      } catch (error) {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        toast.error(error instanceof Error ? error.message : '轮询任务失败');
      }
    }, 2500);
  };

  const handleLoadHotCopies = async () => {
    if (!userId) return;
    setLoadingHotCopies(true);
    try {
      const result = await getDigitalHumanHotCopies(userId, industry.trim());
      setSessionId(result.session_id);
      setHotCopies(result.copies);
      setSelectedCopyIndex(null);
      setRewriteVersions([]);
      setSelectedRewriteIndex(null);
      setReviewResult(null);
      setReviewedScript('');
      setCurrentStep(1);
      toast.success('已生成 mock 爆款文案池');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '获取爆款文案失败');
    } finally {
      setLoadingHotCopies(false);
    }
  };

  const handleGenerateRewrite = async () => {
    if (!userId || !sessionId || !selectedCopy) {
      toast.error('请先选择一条爆款文案');
      return;
    }
    setLoadingRewrite(true);
    try {
      const result = await rewriteDigitalHumanCopy({
        user_id: userId,
        session_id: sessionId,
        source_title: selectedCopy.title,
        source_content: selectedCopy.content,
      });
      setRewriteId(result.rewrite_id);
      setRewriteVersions(result.versions);
      setSelectedRewriteIndex(0);
      setCurrentStep(2);
      toast.success('已生成 3 个仿写版本');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '仿写失败');
    } finally {
      setLoadingRewrite(false);
    }
  };

  const handleLegalReview = async () => {
    if (!userId || !rewriteId || selectedRewriteIndex === null || !selectedRewrite) {
      toast.error('请先选择仿写版本');
      return;
    }
    setLoadingReview(true);
    try {
      const result = await reviewDigitalHumanCopy({
        user_id: userId,
        rewrite_id: rewriteId,
        selected_version_index: selectedRewriteIndex,
        script: selectedRewrite.script,
      });
      setReviewResult(result);
      setReviewId(result.review_id);
      setReviewedScript(result.reviewed_script);
      setCurrentStep(3);
      toast.success('Mock 法务审查已完成');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '法务审查失败');
    } finally {
      setLoadingReview(false);
    }
  };

  const handleUploadFile = async (event: ChangeEvent<HTMLInputElement>, type: 'avatar' | 'voice') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAsset(type);
    try {
      const folder = type === 'avatar' ? 'avatars' : 'voices';
      const url = await uploadDigitalHumanAsset(file, folder);
      if (type === 'avatar') {
        setAvatarUrl(url);
      } else {
        setVoiceSampleUrl(url);
      }
      toast.success(type === 'avatar' ? '头像已上传' : '声音样本已上传');
      setCurrentStep(4);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploadingAsset(null);
      event.target.value = '';
    }
  };

  const handleSubmitJob = async () => {
    if (!userId || !canGenerateJob) {
      toast.error('请先完成脚本审查和素材上传');
      return;
    }
    setSubmittingJob(true);
    try {
      const result = await submitDigitalHumanJob({
        user_id: userId,
        rewrite_id: rewriteId,
        legal_review_id: reviewId,
        industry,
        script_text: reviewedScript,
        cover_title: coverTitle,
        avatar_url: avatarUrl,
        voice_sample_url: voiceSampleUrl,
      });
      setJobResult(result);
      setCurrentStep(5);
      startPolling(result.job_id);
      toast.success('数字人任务已创建，开始 mock 生成');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '提交任务失败');
    } finally {
      setSubmittingJob(false);
    }
  };

  if (authLoading || !user?.id || !isValidUUID(user.id)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-white via-purple-50 to-pink-50">
        <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50 to-pink-50 px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-0 shadow-xl">
          <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 p-3 text-white">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">AI数字人</h1>
                  <p className="text-sm text-slate-500">爆款仿写 + 法务审查 + 数字人口播 mock MVP</p>
                </div>
              </div>
              <p className="text-sm text-slate-600">
                当前模式是 mock 链路，先验证页面、数据和任务流，下一阶段再接真实 API。
              </p>
            </div>
            <div className="rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              测试行业：<span className="font-semibold">{industry}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="grid gap-4 p-4 md:grid-cols-5">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const active = currentStep === step.id;
              const done = currentStep > step.id;

              return (
                <div key={step.id} className={`rounded-2xl border p-4 ${active ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl p-2 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-violet-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">STEP {step.id}</div>
                      <div className="font-medium text-slate-800">{step.label}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>1. 行业爆款池</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="输入行业，例如美业" />
                  <Button onClick={handleLoadHotCopies} disabled={loadingHotCopies}>
                    {loadingHotCopies ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    生成爆款
                  </Button>
                </div>
                <div className="grid gap-3">
                  {hotCopies.map((copy, index) => (
                    <button
                      type="button"
                      key={copy.id}
                      onClick={() => setSelectedCopyIndex(index)}
                      className={`rounded-2xl border p-4 text-left transition ${selectedCopyIndex === index ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300'}`}
                    >
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <div className="font-semibold text-slate-900">{copy.title}</div>
                        <div className="text-xs text-slate-500">赞 {copy.metrics.likes}</div>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{copy.content}</p>
                    </button>
                  ))}
                </div>
                <Button onClick={handleGenerateRewrite} disabled={loadingRewrite || selectedCopyIndex === null || !sessionId}>
                  {loadingRewrite ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  基于已选爆款生成仿写
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>2. 仿写脚本</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {rewriteVersions.map((version, index) => (
                    <button
                      type="button"
                      key={`${version.title}-${index}`}
                      onClick={() => setSelectedRewriteIndex(index)}
                      className={`rounded-2xl border p-4 text-left transition ${selectedRewriteIndex === index ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-white hover:border-violet-300'}`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <div className="font-semibold text-slate-900">{version.title}</div>
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{version.style}</span>
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{version.script}</p>
                    </button>
                  ))}
                </div>
                <Button onClick={handleLegalReview} disabled={loadingReview || selectedRewriteIndex === null || !rewriteId}>
                  {loadingReview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gavel className="mr-2 h-4 w-4" />}
                  进入法务审查
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>3. AI 法务审查</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-400">风险等级</div>
                    <div className="mt-2 text-lg font-semibold text-amber-600">{reviewResult?.risk_level ?? '待审查'}</div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-400">违禁词提示</div>
                    <div className="mt-2 text-sm text-slate-700">
                      {reviewResult?.illegal_terms?.map((item) => item.term).join(' / ') || '暂无'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <div className="text-xs text-slate-400">AI味道</div>
                    <div className="mt-2 text-sm text-slate-700">
                      {reviewResult?.ai_tone_spans?.length ? `${reviewResult.ai_tone_spans.length} 处` : '暂无'}
                    </div>
                  </div>
                </div>
                <Textarea
                  value={reviewedScript}
                  onChange={(e) => setReviewedScript(e.target.value)}
                  rows={10}
                  placeholder="审查后的最终脚本"
                />
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 font-medium text-slate-800">法务建议</div>
                  <ul className="space-y-2 text-sm text-slate-600">
                    {(reviewResult?.suggestions || []).map((suggestion) => (
                      <li key={suggestion}>- {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>4. 上传数字人素材</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input value={coverTitle} onChange={(e) => setCoverTitle(e.target.value)} placeholder="封面标题" />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="rounded-2xl border border-dashed border-slate-300 p-4">
                    <div className="mb-2 flex items-center gap-2 font-medium text-slate-800">
                      <Upload className="h-4 w-4" />
                      上传头像图
                    </div>
                    <input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(e) => handleUploadFile(e, 'avatar')} />
                    <p className="mt-2 text-xs text-slate-500">{avatarUrl || '建议上传正面高清头像'}</p>
                    {uploadingAsset === 'avatar' && <Loader2 className="mt-2 h-4 w-4 animate-spin text-violet-500" />}
                  </label>

                  <label className="rounded-2xl border border-dashed border-slate-300 p-4">
                    <div className="mb-2 flex items-center gap-2 font-medium text-slate-800">
                      <Mic className="h-4 w-4" />
                      上传声音样本
                    </div>
                    <input type="file" accept="audio/*" className="mt-2 block w-full text-sm" onChange={(e) => handleUploadFile(e, 'voice')} />
                    <p className="mt-2 text-xs text-slate-500">{voiceSampleUrl || '建议上传 30-60 秒中文普通话音频'}</p>
                    {uploadingAsset === 'voice' && <Loader2 className="mt-2 h-4 w-4 animate-spin text-violet-500" />}
                  </label>
                </div>
                <Button onClick={handleSubmitJob} disabled={!canGenerateJob || submittingJob}>
                  {submittingJob ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Film className="mr-2 h-4 w-4" />}
                  生成数字人口播视频
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>任务面板</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <div className="text-xs text-slate-400">当前任务</div>
                  <div className="mt-2 font-medium text-slate-800">{jobResult?.job_id || '尚未创建'}</div>
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
                    <span>{progressLabel}</span>
                    <span>{jobResult?.progress ?? 0}%</span>
                  </div>
                  <Progress value={jobResult?.progress ?? 0} />
                </div>
                {jobResult?.cover_title && (
                  <div className="rounded-2xl bg-violet-50 p-4">
                    <div className="text-xs text-violet-500">封面标题</div>
                    <div className="mt-2 font-semibold text-slate-900">{jobResult.cover_title}</div>
                  </div>
                )}
                {jobResult?.cover_url && (
                  <img src={jobResult.cover_url} alt="数字人封面" className="w-full rounded-2xl object-cover shadow" />
                )}
                {jobResult?.video_url && (
                  <video src={jobResult.video_url} controls className="w-full rounded-2xl bg-black" />
                )}
                {jobResult?.subtitle_url && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                    字幕结果：{jobResult.subtitle_url}
                  </div>
                )}
                {jobResult?.error_message && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {jobResult.error_message}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>当前选择</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div>
                  <div className="text-xs text-slate-400">行业</div>
                  <div className="mt-1 font-medium text-slate-900">{industry}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">爆款文案</div>
                  <div className="mt-1">{selectedCopy?.title || '未选择'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">仿写版本</div>
                  <div className="mt-1">{selectedRewrite?.title || '未选择'}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-400">最终脚本字数</div>
                  <div className="mt-1">{reviewedScript.length} 字</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
