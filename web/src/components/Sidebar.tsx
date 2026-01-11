
import React, { useEffect, useRef } from 'react';
import { PlanStep, ChatMessage } from '../../types.ts';
import { Loader2, CheckCircle2, Circle, AlertCircle, Hammer, Send } from 'lucide-react';

interface SidebarProps {
  messages: ChatMessage[];
  plan: PlanStep[];
  isThinking: boolean;
  onSendMessage: (text: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ messages, plan, isThinking, onSendMessage }) => {
  const [inputValue, setInputValue] = React.useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  // 简单的文本格式化
  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split('**').map((part, j) => j % 2 === 1 ? <strong key={j}>{part}</strong> : part)}
        <br />
      </span>
    ));
  };

  return (
    <div className="w-96 bg-white border-l border-gray-100 h-full flex flex-col shadow-2xl z-50 overflow-hidden">
      <div className="p-4 border-b border-gray-50 bg-gray-50/30 flex items-center gap-2">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
          <Hammer className="text-white" size={16} />
        </div>
        <div>
          <h2 className="font-black text-gray-800 tracking-tight">灵匠 助手</h2>
          <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">AI 时代匠心空间</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-black text-white shadow-lg' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {renderText(msg.text)}
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-1 font-medium">
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}

        {isThinking && (
          <div className="flex items-center gap-3 text-black text-sm font-bold animate-pulse">
            <Loader2 className="animate-spin" size={16} />
            <span>灵匠正在深思...</span>
          </div>
        )}

        {plan.length > 0 && (
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">工序清单</h3>
              <span className="text-[9px] bg-black text-white px-2 py-0.5 rounded-full font-black">
                {plan.filter(p => p.status === 'completed').length} / {plan.length}
              </span>
            </div>
            <div className="space-y-2">
              {plan.map((step) => (
                <div key={step.id} className="group relative flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100 hover:border-gray-300 transition-all">
                  <div className="mt-1">
                    {step.status === 'completed' && <CheckCircle2 className="text-green-600" size={18} />}
                    {step.status === 'running' && <Loader2 className="text-black animate-spin" size={18} />}
                    {step.status === 'pending' && <Circle className="text-gray-300" size={18} />}
                    {step.status === 'error' && <AlertCircle className="text-red-500" size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-800 truncate">{step.title}</p>
                    <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="与灵匠对话，描绘您的创意..."
            className="w-full pl-4 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-black/5 focus:border-black transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isThinking}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black text-white rounded-xl disabled:opacity-30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-black/10"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Sidebar;
