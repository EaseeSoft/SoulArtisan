/**
 * 分镜处理页面
 * 支持多图片分割、重组和导出
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { splitImage, mergeImages, fileToDataUrl } from './imageHelpers';
import GridCell from './GridCell';
import './style.css';

interface Asset {
  id: string;
  name: string;
  dataUrl: string;
  segments: string[];
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

const StoryboardCut: React.FC = () => {
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
      } catch (err) {
        console.error("Upload failed", err);
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
    } catch (err) {
      console.error("Merge failed", err);
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
    <div className="sb-cut-page">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleMultipleUpload}
        accept="image/*"
        multiple
        className="sb-hidden"
      />

      {/* 顶部导航栏 */}
      <header className="sb-header">
        <button onClick={handleBack} className="sb-back-btn">
          ← 返回工作台
        </button>
        <div className="sb-logo">
          <div className="sb-logo-icon">
            <LayersIcon className="sb-icon" />
          </div>
          <div>
            <h1 className="sb-title">分镜重组</h1>
            <p className="sb-subtitle">Multi-Image Compositor</p>
          </div>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="sb-add-btn"
        >
          <PlusIcon className="sb-icon-sm" />
          添加原图
        </button>
      </header>

      {/* 主内容区域 */}
      <main className="sb-main">
        <div className="sb-grid-layout">
          {/* 左侧：设置和素材库 */}
          <div className="sb-left-sidebar">
            {/* 网格设定 */}
            <section className="sb-card sb-settings-card">
              <div className="sb-card-header">
                <SettingsIcon className="sb-icon-sm sb-icon-accent" />
                <h2 className="sb-card-title">网格设定</h2>
              </div>
              <div className="sb-settings-grid">
                <div className="sb-setting-field">
                  <label className="sb-setting-label">行数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rows}
                    onChange={(e) => setRows(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="sb-setting-input"
                  />
                </div>
                <div className="sb-setting-field">
                  <label className="sb-setting-label">列数</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cols}
                    onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                    className="sb-setting-input"
                  />
                </div>
              </div>
            </section>

            {/* 素材库 */}
            <section className="sb-card sb-assets-card">
              <div className="sb-card-header">
                <ImageIcon className="sb-icon-sm sb-icon-accent" />
                <h2 className="sb-card-title">素材库 ({assets.length})</h2>
              </div>

              <div className="sb-assets-list">
                {assets.length === 0 ? (
                  <div className="sb-empty-state">
                    <p className="sb-empty-text">暂无素材</p>
                  </div>
                ) : (
                  assets.map((asset, idx) => (
                    <div
                      key={asset.id}
                      onClick={() => setActiveAssetIndex(idx)}
                      className={`sb-asset-item ${activeAssetIndex === idx ? 'sb-active' : ''}`}
                    >
                      <img src={asset.dataUrl} className="sb-asset-thumbnail" alt={asset.name} />
                      <div className="sb-asset-info">
                        <p className="sb-asset-name">{asset.name}</p>
                        <p className="sb-asset-meta">已切割 {asset.segments.length} 块</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeAsset(asset.id); }}
                        className="sb-asset-remove"
                      >
                        <TrashIcon className="sb-icon-sm" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* 中间：素材切割预览 */}
          <div className="sb-middle-panel">
            <div className="sb-card sb-preview-card">
              <div className="sb-preview-header">
                <div>
                  <h3 className="sb-preview-title">素材切割预览</h3>
                  <p className="sb-preview-subtitle">点击素材块，将其放入右侧重组区域</p>
                </div>
                {activeAssetIndex !== null && (
                  <span className="sb-active-asset-badge">
                    {assets[activeAssetIndex].name}
                  </span>
                )}
              </div>

              {activeAssetIndex !== null ? (
                <div
                  className="sb-segments-grid"
                  style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
                >
                  {assets[activeAssetIndex].segments.map((seg, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectSourceSegment(seg)}
                      className="sb-segment-item"
                    >
                      <img src={seg} className="sb-segment-image" alt={`segment ${idx}`} />
                      <div className="sb-segment-overlay">
                        <PlusIcon className="sb-icon-md" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sb-preview-empty">
                  <ImageIcon className="sb-icon-xl" />
                  <p className="sb-preview-empty-text">在左侧选择一张素材图</p>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：重组画板 */}
          <div className="sb-right-sidebar">
            <section className="sb-composition-card">
              <div className="sb-composition-header">
                <div className="sb-composition-title-row">
                  <CheckIcon className="sb-icon-sm sb-icon-accent-secondary" />
                  <h2 className="sb-composition-title">重组画板</h2>
                </div>
                <button onClick={clearComposition} className="sb-clear-link">
                  清空画板
                </button>
              </div>

              <div
                className="sb-composition-grid"
                style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
              >
                {targetComposition.map((slot, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveTargetSlot(idx)}
                    className={`sb-composition-slot ${activeTargetSlot === idx ? 'sb-active' : ''} ${!slot ? 'sb-empty' : ''}`}
                  >
                    {slot ? (
                      <img src={slot} className="sb-slot-image" alt={`slot ${idx}`} />
                    ) : (
                      <span className="sb-slot-number">{idx + 1}</span>
                    )}
                    {activeTargetSlot === idx && (
                      <div className="sb-slot-pulse"></div>
                    )}
                  </div>
                ))}
              </div>

              <div className="sb-composition-actions">
                <button
                  onClick={handleReassemble}
                  disabled={isProcessing}
                  className="sb-generate-btn"
                >
                  <RefreshIcon className={`sb-icon-sm ${isProcessing ? 'sb-spinning' : ''}`} />
                  生成完整预览
                </button>

                {mergedPreview && (
                  <div className="sb-merged-preview">
                    <div className="sb-merged-image-container">
                      <img src={mergedPreview} className="sb-merged-image" alt="merged" />
                    </div>
                    <button
                      onClick={handleDownload}
                      className="sb-download-btn"
                    >
                      <DownloadIcon className="sb-icon-sm" />
                      下载重组大图
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 操作指南 */}
            <div className="sb-guide-card">
              <p className="sb-guide-title">
                <MouseIcon className="sb-icon-xs" />
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

export default StoryboardCut;
