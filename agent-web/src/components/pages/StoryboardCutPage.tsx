/**
 * 分镜处理页面
 * 支持多图片分割、重组和导出
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { upload, showError, showSuccess } from '../../utils/request';
import './StoryboardCutPage.css';

interface Asset {
  id: string;
  name: string;
  dataUrl: string;
  segments: string[];
}

interface UploadResponse {
  code: number;
  msg: string;
  data: {
    id: number;
    url: string;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
}

// 图标组件
const LayersIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 17 12 22 22 17" />
    <polyline points="2 12 12 17 22 12" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const SettingsIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const ImageIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <polyline points="21 15 16 10 5 21" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const RefreshIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const MouseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <rect x="5" y="2" width="14" height="20" rx="7" ry="7" />
    <line x1="12" y1="6" x2="12" y2="10" />
  </svg>
);

/**
 * Splits an image into a grid of segments.
 */
const splitImage = async (
  imageSrc: string,
  rows: number,
  cols: number
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const segmentWidth = img.width / cols;
      const segmentHeight = img.height / rows;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = segmentWidth;
      canvas.height = segmentHeight;

      const results: string[] = [];

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.clearRect(0, 0, segmentWidth, segmentHeight);
          ctx.drawImage(
            img,
            c * segmentWidth,
            r * segmentHeight,
            segmentWidth,
            segmentHeight,
            0,
            0,
            segmentWidth,
            segmentHeight
          );
          results.push(canvas.toDataURL('image/png'));
        }
      }
      resolve(results);
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
};

/**
 * Merges multiple segments back into a single image.
 */
const mergeImages = async (
  segments: string[],
  rows: number,
  cols: number
): Promise<string> => {
  if (segments.length === 0) return '';

  return new Promise((resolve, reject) => {
    const firstImg = new Image();
    firstImg.onload = () => {
      const sw = firstImg.width;
      const sh = firstImg.height;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) return reject(new Error('No context'));

      canvas.width = sw * cols;
      canvas.height = sh * rows;

      let loadedCount = 0;
      segments.forEach((src, index) => {
        const img = new Image();
        img.onload = () => {
          const r = Math.floor(index / cols);
          const c = index % cols;
          ctx.drawImage(img, c * sw, r * sh, sw, sh);
          loadedCount++;
          if (loadedCount === segments.length) {
            resolve(canvas.toDataURL('image/png'));
          }
        };
        img.onerror = reject;
        img.src = src;
      });
    };
    firstImg.src = segments[0];
  });
};

/**
 * Convert file to dataUrl.
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Grid Cell Component
interface GridCellProps {
  dataUrl: string;
  index: number;
  onReplace?: (index: number, newDataUrl: string) => void;
  onClick?: () => void;
  showNumber?: boolean;
}

const GridCell: React.FC<GridCellProps> = ({ dataUrl, index, onReplace, onClick, showNumber = true }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onReplace) {
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
    link.download = `storyboard-${index + 1}.png`;
    link.click();
  };

  return (
    <div
      onClick={onClick}
      className="storyboard-grid-cell"
    >
      <img src={dataUrl} alt={`分镜 ${index + 1}`} className="cell-image" />

      <div className="cell-overlay">
        <div className="cell-actions">
          {onReplace && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="cell-action-btn"
              title="本地替换"
            >
              <RefreshIcon className="icon-sm" />
            </button>
          )}
          <button
            onClick={handleDownload}
            className="cell-action-btn"
            title="下载此图"
          >
            <DownloadIcon className="icon-sm" />
          </button>
        </div>
      </div>

      {showNumber && <div className="cell-number">#{index + 1}</div>}

      {onReplace && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
      )}
    </div>
  );
};

const StoryboardCutPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [activeAssetIndex, setActiveAssetIndex] = useState<number | null>(null);
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  // The composition grid (Target)
  const [targetComposition, setTargetComposition] = useState<(string | null)[]>([]);
  const [activeTargetSlot, setActiveTargetSlot] = useState<number | null>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [mergedPreview, setMergedPreview] = useState<string | null>(null);

  // Initialize/Reset target composition when rows/cols change
  useEffect(() => {
    setTargetComposition(new Array(rows * cols).fill(null));
    setActiveTargetSlot(0);
    setMergedPreview(null);

    // Re-split all assets with new dimensions
    const updateAssets = async () => {
      if (assets.length === 0) return;
      setIsProcessing(true);
      const newAssets = await Promise.all(assets.map(async (asset) => {
        const segments = await splitImage(asset.dataUrl, rows, cols);
        return { ...asset, segments };
      }));
      setAssets(newAssets);
      setIsProcessing(false);
    };
    updateAssets();
  }, [rows, cols]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleMultipleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setIsProcessing(true);
      try {
        const newAssets: Asset[] = await Promise.all(files.map(async (file) => {
          const dataUrl = await fileToDataUrl(file);
          const segments = await splitImage(dataUrl, rows, cols);
          return {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            dataUrl,
            segments
          };
        }));

        setAssets(prev => [...prev, ...newAssets]);
        if (activeAssetIndex === null) setActiveAssetIndex(0);
        showSuccess(`成功添加 ${newAssets.length} 张原图`);
      } catch (err) {
        console.error("Upload failed", err);
        showError('部分图片加载失败');
      } finally {
        setIsProcessing(false);
        if (e.target) e.target.value = '';
      }
    }
  };

  const selectSourceSegment = (dataUrl: string) => {
    setTargetComposition(prev => {
      const next = [...prev];
      const slotToFill = activeTargetSlot !== null ? activeTargetSlot : next.findIndex(s => s === null);

      if (slotToFill !== -1 && slotToFill < next.length) {
        next[slotToFill] = dataUrl;
      }
      return next;
    });

    // Move focus to next empty slot if we were just filling sequentially
    if (activeTargetSlot !== null) {
      setActiveTargetSlot(prev => (prev !== null && prev < rows * cols - 1) ? prev + 1 : null);
    }
    setMergedPreview(null);
  };

  const handleReassemble = async () => {
    // Fill empty slots with transparent placeholder if necessary
    const processedSegments = targetComposition.map(s => s || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7');

    setIsProcessing(true);
    try {
      const merged = await mergeImages(processedSegments, rows, cols);
      setMergedPreview(merged);
      showSuccess('生成预览成功');
    } catch (err) {
      console.error("Merge failed", err);
      showError('合并失败');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!mergedPreview) return;
    const link = document.createElement('a');
    link.href = mergedPreview;
    link.download = `composition-${Date.now()}.png`;
    link.click();
    showSuccess('下载完成');
  };

  const removeAsset = (id: string) => {
    setAssets(prev => {
      const filtered = prev.filter(a => a.id !== id);
      if (filtered.length === 0) setActiveAssetIndex(null);
      else setActiveAssetIndex(0);
      return filtered;
    });
  };

  const clearComposition = () => {
    setTargetComposition(new Array(rows * cols).fill(null));
    setActiveTargetSlot(0);
    setMergedPreview(null);
  };

  return (
    <div className="storyboard-cut-page">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMultipleUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* 顶部导航栏 */}
      <header className="page-header">
        <button onClick={handleBack} className="back-button">
          ← 返回工作台
        </button>
        <div className="header-logo">
          <div className="logo-icon">
            <LayersIcon className="icon" />
          </div>
          <div>
            <h1 className="page-title">分镜重组</h1>
            <p className="page-subtitle">Multi-Image Compositor</p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="add-button"
        >
          <PlusIcon className="icon-sm" />
          添加原图
        </button>
      </header>

      {/* 主内容区域 */}
      <main className="page-content">
        <div className="grid-layout">
          {/* 左侧：设置和素材库 */}
          <div className="left-sidebar">
            {/* 网格设定 */}
            <section className="card settings-card">
              <div className="card-header">
                <SettingsIcon className="icon-sm icon-accent" />
                <h2 className="card-title">网格设定</h2>
              </div>
              <div className="settings-grid">
                <div className="setting-field">
                  <label className="setting-label">行数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rows}
                    onChange={(e) => setRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="setting-input"
                  />
                </div>
                <div className="setting-field">
                  <label className="setting-label">列数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cols}
                    onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="setting-input"
                  />
                </div>
              </div>
            </section>

            {/* 素材库 */}
            <section className="card assets-card">
              <div className="card-header">
                <ImageIcon className="icon-sm icon-accent" />
                <h2 className="card-title">素材库 ({assets.length})</h2>
              </div>

              <div className="assets-list">
                {assets.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-text">暂无素材</p>
                  </div>
                ) : (
                  assets.map((asset, idx) => (
                    <div
                      key={asset.id}
                      onClick={() => setActiveAssetIndex(idx)}
                      className={`asset-item ${activeAssetIndex === idx ? 'active' : ''}`}
                    >
                      <img src={asset.dataUrl} className="asset-thumbnail" alt={asset.name} />
                      <div className="asset-info">
                        <p className="asset-name">{asset.name}</p>
                        <p className="asset-meta">已切割 {asset.segments.length} 块</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                        className="asset-remove"
                      >
                        <TrashIcon className="icon-sm" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* 中间：素材切割预览 */}
          <div className="middle-panel">
            <div className="card preview-card">
              <div className="preview-header">
                <div>
                  <h3 className="preview-title">素材切割预览</h3>
                  <p className="preview-subtitle">点击素材块，将其放入右侧重组区域</p>
                </div>
                {activeAssetIndex !== null && (
                  <span className="active-asset-badge">
                    {assets[activeAssetIndex].name}
                  </span>
                )}
              </div>

              {activeAssetIndex !== null ? (
                <div
                  className="segments-grid"
                  style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                >
                  {assets[activeAssetIndex].segments.map((seg, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSourceSegment(seg)}
                      className="segment-item"
                    >
                      <img src={seg} className="segment-image" alt={`segment ${idx}`} />
                      <div className="segment-overlay">
                        <PlusIcon className="icon-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="preview-empty">
                  <ImageIcon className="icon-xl" />
                  <p className="preview-empty-text">在左侧选择一张素材图</p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：重组画板 */}
          <div className="right-sidebar">
            <section className="composition-card">
              <div className="composition-header">
                <div className="composition-title-row">
                  <CheckIcon className="icon-sm icon-accent-secondary" />
                  <h2 className="composition-title">重组画板</h2>
                </div>
                <button onClick={clearComposition} className="clear-link">
                  清空画板
                </button>
              </div>

              <div
                className="composition-grid"
                style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
              >
                {targetComposition.map((slot, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveTargetSlot(idx)}
                    className={`composition-slot ${activeTargetSlot === idx ? 'active' : ''} ${!slot ? 'empty' : ''}`}
                  >
                    {slot ? (
                      <img src={slot} className="slot-image" alt={`slot ${idx}`} />
                    ) : (
                      <span className="slot-number">{idx + 1}</span>
                    )}
                    {activeTargetSlot === idx && (
                      <div className="slot-pulse"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="composition-actions">
                <button
                  onClick={handleReassemble}
                  disabled={isProcessing}
                  className="generate-button"
                >
                  <RefreshIcon className={`icon-sm ${isProcessing ? 'spinning' : ''}`} />
                  生成完整预览
                </button>

                {mergedPreview && (
                  <div className="merged-preview">
                    <div className="merged-image-container">
                      <img src={mergedPreview} className="merged-image" alt="merged" />
                    </div>
                    <button
                      onClick={handleDownload}
                      className="download-button"
                    >
                      <DownloadIcon className="icon-sm" />
                      下载重组大图
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 操作指南 */}
            <div className="guide-card">
              <p className="guide-title">
                <MouseIcon className="icon-xs" />
                操作指南：
              </p>
              <p>1. 上传多张原图到素材库。</p>
              <p>2. 在画板中点击选中一个格子。</p>
              <p>3. 从素材切割预览中点击喜欢的块，填入格子。</p>
              <p>4. 跨素材组合完成后，点击"生成完整预览"下载。</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StoryboardCutPage;
