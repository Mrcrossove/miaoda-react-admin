import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { agents } from '@/config/agents';
import { Brain, Sparkles } from 'lucide-react';

export default function CognitiveAwakeningPage() {
  const navigate = useNavigate();

  const handleAgentClick = (agentId: string) => {
    navigate(`/agent-chat/${agentId}`);
  };

  // 为每个智能体分配不同的彩色背景
  const cardColors = [
    'bg-card-purple',
    'bg-card-pink',
    'bg-card-blue',
    'bg-card-green',
    'bg-card-orange',
    'bg-card-yellow',
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 头部Banner - 花哨渐变风格 */}
      <div className="relative overflow-hidden bg-gradient-purple-blue text-white px-6 py-10 shadow-heavy">
        {/* 装饰性背景 */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-neon-cyan/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-neon-pink/30 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 rounded-3xl bg-white/30 backdrop-blur-md flex items-center justify-center shadow-neon animate-pulse-scale">
              <Brain className="w-9 h-9 animate-bounce-soft" />
            </div>
            <div>
              <h1 className="text-3xl font-black drop-shadow-lg">认知觉醒</h1>
              <p className="text-base font-bold mt-1 drop-shadow-md">
                与智能体对话，开启认知升级之旅
              </p>
            </div>
          </div>
        </div>
        
        {/* 装饰性图形 */}
        <div className="absolute top-4 right-8 w-10 h-10 border-4 border-white/40 rounded-full animate-spin-slow" />
        <div className="absolute bottom-6 left-12 w-6 h-6 bg-white/30 rotate-45 animate-wiggle" />
      </div>

      {/* 智能体列表 */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map((agent, index) => (
            <Card
              key={agent.id}
              className={`cursor-pointer transition-all duration-300 shadow-heavy border-2 border-transparent hover:border-gold card-float ${cardColors[index % cardColors.length]}`}
              onClick={() => handleAgentClick(agent.id)}
            >
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-purple-blue shadow-colorful flex items-center justify-center text-3xl animate-pulse-scale">
                    {agent.icon}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-xl font-black">{agent.name}</CardTitle>
                    {agent.enableWebSearch && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary mt-1 px-2 py-0.5 rounded-full bg-gradient-cyan-blue text-white shadow-neon">
                        <Sparkles className="w-3 h-3 animate-spin-slow" />
                        联网搜索
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm font-bold text-foreground/80">
                  {agent.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
