
import React, { useRef } from 'react';

interface GridCellProps {
  dataUrl: string;
  index: number;
  onReplace: (index: number, newDataUrl: string) => void;
  onToggleSelect: (index: number) => void;
}

const GridCell: React.FC<GridCellProps> = ({
  dataUrl,
  index,
  onReplace,
  onToggleSelect
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onReplace(index, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `segment-${index + 1}.png`;
    link.click();
  };

  return (
    <div
      onClick={() => onToggleSelect(index)}
      className="group relative aspect-square bg-slate-50 border-2 border-slate-100 overflow-hidden rounded-xl shadow-sm transition-all cursor-pointer hover:border-indigo-300"
    >
      <img
        src={dataUrl}
        alt={`Grid cell ${index}`}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />

      {/* Overlay Actions */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-opacity">
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="bg-white p-2 rounded-full text-slate-800 hover:bg-indigo-600 hover:text-white transition-all shadow-xl"
            title="本地替换"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <polyline points="3 12 9 12 15 12"></polyline>
              <path d="M22 13.5a9 9 0 0 1-9 9c-2 0-4-1-5.2-2.3"></path>
            </svg>
          </button>
          <button
            onClick={handleDownload}
            className="bg-white p-2 rounded-full text-slate-800 hover:bg-green-600 hover:text-white transition-all shadow-xl"
            title="下载此图"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
          </button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="absolute bottom-2 left-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm opacity-60">
        #{index + 1}
      </div>
    </div>
  );
};

export default GridCell;
