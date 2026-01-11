
import React, { useRef } from 'react';
import { MousePointer2, Hand, Image as ImageIcon, Type, ZoomIn, ZoomOut, Maximize, LayoutTemplate, Plus } from 'lucide-react';

interface ToolbarProps {
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onResetView: () => void;
  onAddWorkflow: () => void;
  onAddImage: (file: File) => void;
  onAddText: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({ zoom, onZoomChange, onResetView, onAddWorkflow, onAddImage, onAddText }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onAddImage(file);
      e.target.value = ''; // Reset for next selection
    }
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/20 z-50">
      <div className="flex items-center gap-1 border-r pr-2 border-gray-200">
        <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors" title="移动画布"><Hand size={20} /></button>
        <button className="p-2 bg-black text-white rounded-lg transition-colors" title="选择/拖拽"><MousePointer2 size={20} /></button>
      </div>
      
      <div className="flex items-center gap-1 border-r pr-2 border-gray-100">
        <button 
          onClick={onAddWorkflow}
          className="flex flex-col items-center gap-0.5 p-2 hover:bg-gray-100 rounded-lg text-gray-700 group transition-all"
          title="创建灵感捕捉框架"
        >
          <LayoutTemplate size={20} className="group-hover:scale-110" />
          <span className="text-[8px] font-black uppercase">框架</span>
        </button>

        <button 
          onClick={handleImageClick}
          className="flex flex-col items-center gap-0.5 p-2 hover:bg-gray-100 rounded-lg text-gray-700 group transition-all"
          title="上传图片组件"
        >
          <ImageIcon size={20} className="group-hover:scale-110" />
          <span className="text-[8px] font-black uppercase">图片</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </button>

        <button 
          onClick={onAddText}
          className="flex flex-col items-center gap-0.5 p-2 hover:bg-gray-100 rounded-lg text-gray-700 group transition-all"
          title="添加文本组件"
        >
          <Type size={20} className="group-hover:scale-110" />
          <span className="text-[8px] font-black uppercase">文本</span>
        </button>
      </div>

      <div className="flex items-center gap-2 pl-2">
        <button onClick={() => onZoomChange(Math.max(0.1, zoom - 0.1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"><ZoomOut size={20} /></button>
        <span className="text-xs font-bold text-gray-500 min-w-[40px] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => onZoomChange(Math.min(5, zoom + 0.1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"><ZoomIn size={20} /></button>
        <button onClick={onResetView} className="p-2 hover:bg-gray-100 rounded-lg text-gray-700"><Maximize size={18} /></button>
      </div>
    </div>
  );
};

export default Toolbar;
