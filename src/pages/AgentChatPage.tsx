import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Send, Loader2, Copy, Table, Network, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getAgentById } from '@/config/agents';
import { sendStreamRequest } from '@/utils/stream';
import { Streamdown } from 'streamdown';

// 输出格式类型
type OutputFormat = 'text' | 'table' | 'mindmap';

// 消息类型
interface Message {
  role: 'user' | 'assistant';
  content: string;
  format?: OutputFormat;
}

export default function AgentChatPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(getAgentById(agentId || ''));
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('text');
  const [typingText, setTypingText] = useState('');
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedResponseRef = useRef<string>(''); // 用于累积响应内容

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  // 如果智能体不存在，返回列表页
  useEffect(() => {
    if (!agent) {
      toast.error('智能体不存在');
      navigate('/cognitive-awakening');
    }
  }, [agent, navigate]);

  // 动态打字效果
  useEffect(() => {
    if (!agent || messages.length > 0) return;

    const examples = agent.exampleQuestions || [];
    if (examples.length === 0) return;

    let charIndex = 0;
    const currentExample = examples[currentExampleIndex];

    // 清除之前的定时器
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    // 重置打字文本
    setTypingText('');

    // 开始打字动画
    typingIntervalRef.current = setInterval(() => {
      if (charIndex < currentExample.length) {
        setTypingText(currentExample.slice(0, charIndex + 1));
        charIndex++;
      } else {
        // 打字完成，等待2秒后切换到下一个示例
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
        }
        setTimeout(() => {
          setCurrentExampleIndex((prev) => (prev + 1) % examples.length);
        }, 2000);
      }
    }, 50);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, [agent, currentExampleIndex, messages.length]);

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setCurrentResponse('');
    accumulatedResponseRef.current = ''; // 重置累积响应

    // 创建中断控制器
    abortControllerRef.current = new AbortController();

    try {
      await sendStreamRequest({
        functionUrl: `${supabaseUrl}/functions/v1/agent-chat`,
        requestBody: {
          agentId: agent?.id,
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          enableWebSearch: agent?.enableWebSearch || false,
          outputFormat,
        },
        supabaseAnonKey,
        onData: (data) => {
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.choices?.[0]?.delta?.content || '';
            if (chunk) {
              accumulatedResponseRef.current += chunk; // 累积到 ref
              setCurrentResponse(accumulatedResponseRef.current); // 更新显示
            }
          } catch (e) {
            console.warn('解析数据失败:', e);
          }
        },
        onComplete: () => {
          // 使用 ref 中的完整内容
          const finalContent = accumulatedResponseRef.current;
          console.log('对话完成，最终内容长度:', finalContent.length);
          
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: finalContent,
              format: outputFormat,
            },
          ]);
          setCurrentResponse('');
          accumulatedResponseRef.current = ''; // 清空 ref
          setIsLoading(false);
        },
        onError: (error) => {
          console.error('请求失败:', error);
          toast.error('请求失败，请稍后重试');
          setIsLoading(false);
          setCurrentResponse('');
          accumulatedResponseRef.current = ''; // 清空 ref
        },
        signal: abortControllerRef.current.signal,
      });
    } catch (error) {
      console.error('发送消息失败:', error);
      toast.error('发送消息失败');
      setIsLoading(false);
      setCurrentResponse('');
      accumulatedResponseRef.current = ''; // 清空 ref
    }
  };

  // 停止生成
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
      
      // 使用 ref 中的内容
      const finalContent = accumulatedResponseRef.current;
      if (finalContent) {
        setMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: finalContent,
            format: outputFormat,
          },
        ]);
        setCurrentResponse('');
        accumulatedResponseRef.current = ''; // 清空 ref
      }
    }
  };

  // 复制内容
  const handleCopy = (content: string, format?: OutputFormat) => {
    let textToCopy = content;

    // 根据格式处理复制内容
    if (format === 'table') {
      // 表格格式转换为Excel兼容格式（制表符分隔）
      textToCopy = content.replace(/\|/g, '\t').replace(/\n-+\n/g, '\n');
    }

    navigator.clipboard.writeText(textToCopy);
    
  };

  // 切换输出格式
  const handleFormatChange = (format: OutputFormat) => {
    setOutputFormat(format);
  };

  // 渲染消息内容
  const renderMessageContent = (message: Message) => {
    const format = message.format || 'text';

    if (format === 'mindmap') {
      // 思维导图格式（使用mermaid）
      return (
        <div className="bg-muted p-4 rounded-lg overflow-x-auto">
          <Streamdown parseIncompleteMarkdown={true}>
            {message.content}
          </Streamdown>
        </div>
      );
    } else if (format === 'table') {
      // 表格格式
      return (
        <div className="bg-muted p-4 rounded-lg overflow-x-auto">
          <Streamdown parseIncompleteMarkdown={true}>
            {message.content}
          </Streamdown>
        </div>
      );
    } else {
      // 纯文本格式
      return (
        <div className="prose prose-sm max-w-none">
          <Streamdown parseIncompleteMarkdown={true}>
            {message.content}
          </Streamdown>
        </div>
      );
    }
  };

  if (!agent) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50">
      {/* 顶部导航 */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-4 flex items-center gap-3 shadow-lg">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/cognitive-awakening')}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1">
          <div className="text-3xl">{agent.icon}</div>
          <div>
            <h1 className="text-lg font-bold">{agent.name}</h1>
            <p className="text-xs text-purple-100">{agent.description}</p>
          </div>
        </div>
      </div>

      {/* 格式切换按钮 */}
      <div className="bg-white border-b px-4 py-2 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">输出格式：</span>
        <Button
          variant={outputFormat === 'text' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFormatChange('text')}
          className="gap-1"
        >
          <FileText className="w-4 h-4" />
          纯文本
        </Button>
        <Button
          variant={outputFormat === 'table' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFormatChange('table')}
          className="gap-1"
        >
          <Table className="w-4 h-4" />
          表格
        </Button>
        <Button
          variant={outputFormat === 'mindmap' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleFormatChange('mindmap')}
          className="gap-1"
        >
          <Network className="w-4 h-4" />
          思维导图
        </Button>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{agent.icon}</div>
            <p className="text-lg font-medium mb-2">开始与{agent.name}对话</p>
            <p className="text-sm text-muted-foreground mb-6">{agent.description}</p>
            
            {/* 示例问题 */}
            {agent.exampleQuestions && agent.exampleQuestions.length > 0 && (
              <div className="max-w-2xl mx-auto mt-8">
                <p className="text-sm text-muted-foreground mb-4">💡 试试这些问题</p>
                <div className="space-y-3">
                  {agent.exampleQuestions.map((question, index) => (
                    <Card
                      key={index}
                      className="p-4 cursor-pointer hover:shadow-md hover:border-purple-400 transition-all text-left"
                      onClick={() => setInput(question)}
                    >
                      <p className="text-sm">{question}</p>
                    </Card>
                  ))}
                </div>
                
                {/* 动态打字效果 */}
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <p className="text-xs text-muted-foreground mb-2">正在输入...</p>
                  <p className="text-sm min-h-[24px]">
                    {typingText}
                    <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse"></span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card
              className={`max-w-[80%] ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white'
              }`}
            >
              <div className="p-4">
                {message.role === 'assistant' && (
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      {message.format === 'text' ? '纯文本' : message.format === 'table' ? '表格' : '思维导图'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(message.content, message.format)}
                      className="gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      复制
                    </Button>
                  </div>
                )}
                {renderMessageContent(message)}
              </div>
            </Card>
          </div>
        ))}

        {/* 当前正在生成的回复 */}
        {isLoading && currentResponse && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] bg-white">
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">
                    {outputFormat === 'text' ? '纯文本' : outputFormat === 'table' ? '表格' : '思维导图'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(currentResponse, outputFormat)}
                    className="gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    复制
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none">
                  <Streamdown parseIncompleteMarkdown={true} isAnimating={true}>
                    {currentResponse}
                  </Streamdown>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="输入你的问题..."
            className="resize-none"
            rows={3}
            disabled={isLoading}
          />
          {isLoading ? (
            <Button onClick={handleStop} variant="destructive" size="icon" className="shrink-0">
              <Loader2 className="w-5 h-5 animate-spin" />
            </Button>
          ) : (
            <Button onClick={handleSend} size="icon" className="shrink-0" disabled={!input.trim()}>
              <Send className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
