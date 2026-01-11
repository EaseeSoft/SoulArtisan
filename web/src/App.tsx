import React, { useState } from 'react';
import { Trash2, Hammer, PanelRightClose, PanelRight, User, LogOut, ChevronDown } from 'lucide-react';
import { CanvasItem, PlanStep, ChatMessage } from '../types';
import Canvas from '@/components/Canvas';
import Sidebar from '@/components/Sidebar';
import Toolbar from '@/components/Toolbar';
import HomePage from '@/components/HomePage';
import LoginPage from '@/components/LoginPage';
import RegisterPage from '@/components/RegisterPage';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthContext from '@/contexts/AuthContext';
import { generatePlan, generateImage, generateBrainstorm, performResearch } from '@/services/gemini';

type ViewType = 'home' | 'canvas' | 'login' | 'register';

function AppContent() {
  const auth = React.useContext(AuthContext);
  const [view, setView] = useState<ViewType>('home');
  const [items, setItems] = useState<CanvasItem[]>([]);
  const [plan, setPlan] = useState<PlanStep[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const addWorkflow = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newItem: CanvasItem = {
      id: newId,
      type: 'workflow',
      content: '',
      x: (-pan.x + window.innerWidth/2) / zoom - 250,
      y: (-pan.y + window.innerHeight/2) / zoom - 200,
      width: 500,
      height: 400,
      status: 'completed',
      zIndex: 100,
      layers: []
    };
    setItems(prev => [...prev, newItem]);
    setSelectedIds([newId]);
  };

  const addImageItem = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        const newItem: CanvasItem = {
          id: newId,
          type: 'image',
          content: content,
          x: (-pan.x + window.innerWidth/2) / zoom - img.width/2,
          y: (-pan.y + window.innerHeight/2) / zoom - img.height/2,
          width: img.width,
          height: img.height,
          status: 'completed',
          label: file.name,
          zIndex: 50,
          layers: []
        };
        setItems(prev => [...prev, newItem]);
        setSelectedIds([newId]);
      };
      img.src = content;
    };
    reader.readAsDataURL(file);
  };

  const addTextItem = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newItem: CanvasItem = {
      id: newId,
      type: 'text',
      content: '双击此处输入文字...',
      x: (-pan.x + window.innerWidth/2) / zoom - 100,
      y: (-pan.y + window.innerHeight/2) / zoom - 50,
      width: 250,
      height: 120,
      status: 'completed',
      label: '文本组件',
      zIndex: 60,
      layers: []
    };
    setItems(prev => [...prev, newItem]);
    setSelectedIds([newId]);
  };

  const addMessage = (text: string, role: 'user' | 'assistant') => {
    setMessages(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), role, text, timestamp: Date.now() }]);
  };

  const handleUpdateItem = (id: string, updates: Partial<CanvasItem>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteItems = (ids: string[]) => {
    setItems(prev => prev.filter(i => !ids.includes(i.id)));
    setSelectedIds([]);
  };

  const handleReorderItem = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setItems(prev => {
      const index = prev.findIndex(i => i.id === id);
      if (index === -1) return prev;
      const newItems = [...prev];
      const [item] = newItems.splice(index, 1);
      switch (direction) {
        case 'top': newItems.push(item); break;
        case 'bottom': newItems.unshift(item); break;
        case 'up': newItems.splice(Math.min(index + 1, newItems.length), 0, item); break;
        case 'down': newItems.splice(Math.max(index - 1, 0), 0, item); break;
      }
      return newItems;
    });
  };

  const executePlan = async (steps: any[]) => {
    const newSteps: PlanStep[] = steps.map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      title: s.title,
      description: s.description,
      status: 'pending',
      type: s.type,
      imagePrompt: s.imagePrompt
    }));
    setPlan(newSteps);

    const spacing = 450;
    const itemsPerRow = 3;
    const startX = (-pan.x + 100) / zoom;
    const startY = (-pan.y + 100) / zoom;

    const imageSteps = newSteps.filter(s => s.type === 'generate_image' || s.type === 'workflow');
    const placeholders: CanvasItem[] = imageSteps.map((s, index) => ({
      id: s.id,
      type: s.type === 'generate_image' ? 'image' : 'workflow',
      content: '',
      x: startX + (index % itemsPerRow) * spacing,
      y: startY + Math.floor(index / itemsPerRow) * spacing,
      width: 400,
      height: 400,
      status: 'loading',
      label: s.title,
      zIndex: 1,
      layers: []
    }));
    setItems(prev => [...prev, ...placeholders]);

    for (const step of newSteps) {
      setPlan(prev => prev.map(p => p.id === step.id ? { ...p, status: 'running' } : p));
      try {
        if (step.type === 'generate_image') {
          const img = await generateImage(step.imagePrompt || step.description, 'none');
          handleUpdateItem(step.id, { content: img, status: 'completed' });
        } else if (step.type === 'research') {
          const research = await performResearch(step.description);
          addMessage(`**${step.title} 研究结果：**\n\n${research.text}`, 'assistant');
        } else if (step.type === 'brainstorm') {
          const text = await generateBrainstorm(step.title, step.description);
          addMessage(`**${step.title} 方案：**\n\n${text}`, 'assistant');
        } else if (step.type === 'workflow') {
          handleUpdateItem(step.id, { status: 'completed' });
        }
        setPlan(prev => prev.map(p => p.id === step.id ? { ...p, status: 'completed' } : p));
      } catch (e) {
        setPlan(prev => prev.map(p => p.id === step.id ? { ...p, status: 'error' } : p));
        if (imageSteps.some(s => s.id === step.id)) {
          handleUpdateItem(step.id, { status: 'error' });
        }
      }
    }
  };

  const startGeneration = async (prompt: string) => {
    setView('canvas');
    addMessage(prompt, 'user');
    setIsThinking(true);
    try {
      const result = await generatePlan(prompt);
      if (result.steps?.length) {
        addMessage(`灵匠正在为您规划创作方案，图片将显示在画布上，详细研究与文案将显示在此处。`, 'assistant');
        executePlan(result.steps);
      }
    } finally { setIsThinking(false); }
  };

  const handleLogout = () => {
    auth?.logout();
    setShowUserMenu(false);
  };

  if (view === 'login') {
    return (
      <LoginPage
        onBack={() => setView('home')}
        onSuccess={() => setView('home')}
        onGoRegister={() => setView('register')}
      />
    );
  }

  if (view === 'register') {
    return (
      <RegisterPage
        onBack={() => setView('home')}
        onSuccess={() => setView('home')}
        onGoLogin={() => setView('login')}
      />
    );
  }

  if (view === 'home') {
    return (
      <HomePage
        onStart={startGeneration}
        onEnterCanvas={() => setView('canvas')}
        onGoLogin={() => setView('login')}
        onGoRegister={() => setView('register')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#fcfcfc] overflow-hidden font-sans text-gray-900">
      <div className="flex-1 relative flex flex-col min-w-0">
        <header className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-3xl border-b border-gray-100 px-6 flex items-center justify-between z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('home')} className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Hammer className="text-white" size={18} />
              </div>
              <div className="flex flex-col -gap-1 text-left">
                <span className="font-black text-lg tracking-tighter text-gray-900 leading-none">灵匠</span>
                <span className="text-[7px] font-black uppercase tracking-widest text-gray-400">Project Space</span>
              </div>
            </button>
            <div className="hidden md:flex items-center gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-300 ml-4">
              <span>正在工作</span>
              <div className="w-1 h-1 rounded-full bg-indigo-400" />
              <span>灵动实验室</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 rounded-xl transition-all ${showSidebar ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}
              title={showSidebar ? "隐藏侧边栏" : "显示侧边栏"}
            >
              {showSidebar ? <PanelRightClose size={18} /> : <PanelRight size={18} />}
            </button>
            <div className="h-4 w-[1px] bg-gray-100 mx-1" />
            <button onClick={() => { if(confirm('确定清空匠心画布吗？')) { setItems([]); setPlan([]); setMessages([]); setSelectedIds([]); } }} className="p-2 text-gray-300 hover:text-red-500 rounded-xl transition-all"><Trash2 size={18} /></button>
            <div className="h-4 w-[1px] bg-gray-100 mx-1" />

            {auth?.isAuthenticated && auth?.userInfo ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-100 text-gray-900 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all"
                >
                  <div className="w-6 h-6 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <User size={14} className="text-indigo-600" />
                  </div>
                  <span className="max-w-[80px] truncate hidden sm:inline">{auth.userInfo.nickname || auth.userInfo.username}</span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-900 truncate">{auth.userInfo.nickname || auth.userInfo.username}</p>
                        <p className="text-xs text-gray-400 truncate">{auth.userInfo.email || `积分: ${auth.userInfo.points}`}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors"
                      >
                        <LogOut size={16} />
                        退出登录
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setView('login')}
                className="px-5 py-2 text-xs font-black bg-black text-white rounded-xl shadow-lg hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest"
              >
                登录
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 pt-16">
          <Canvas
            items={items}
            zoom={zoom}
            onZoomChange={setZoom}
            pan={pan}
            onPanChange={setPan}
            onItemUpdate={handleUpdateItem}
            onItemDelete={(id) => handleDeleteItems([id])}
            onItemDeleteMultiple={handleDeleteItems}
            onItemAdd={(item) => { setItems(prev => [...prev, item]); setSelectedIds([item.id]); }}
            onItemReorder={handleReorderItem}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
          />
        </div>

        <Toolbar
          zoom={zoom}
          onZoomChange={setZoom}
          onResetView={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          onAddWorkflow={addWorkflow}
          onAddImage={addImageItem}
          onAddText={addTextItem}
        />
      </div>

      <div className={`flex-shrink-0 transition-all duration-300 ease-in-out ${showSidebar ? 'w-96 opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full'}`}>
        <Sidebar messages={messages} plan={plan} isThinking={isThinking} onSendMessage={async (t) => {
          addMessage(t, 'user');
          setIsThinking(true);
          try {
            const result = await generatePlan(t);
            if (result.steps?.length) {
              executePlan(result.steps);
            }
          } finally { setIsThinking(false); }
        }} />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
