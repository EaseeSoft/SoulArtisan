/**
 * 媒体反推页面
 * 支持图片反推和视频反推
 */

import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { upload, showError, showSuccess } from '../../utils/request';
import { imagePromptReverse, videoPromptReverse } from '../../api/playbook';
import './MediaReversePage.css';

type MediaType = 'image' | 'video';

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

const MediaReversePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mediaType, setMediaType] = useState<MediaType>('image');
  const [mediaUrl, setMediaUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState('');

  const handleBack = () => {
    navigate('/dashboard');
  };

  // 切换媒体类型
  const handleTypeChange = (type: MediaType) => {
    setMediaType(type);
    setMediaUrl('');
    setPreviewUrl('');
    setResult('');
  };

  // 处理文件上传
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (mediaType === 'image' && !isImage) {
      showError('请选择图片文件');
      return;
    }
    if (mediaType === 'video' && !isVideo) {
      showError('请选择视频文件');
      return;
    }

    // 上传文件
    try {
      setUploading(true);
      setUploadProgress(0);

      const response = await upload<UploadResponse>(
        '/api/file/upload',
        file,
        (progress) => setUploadProgress(progress)
      );

      if (response.data.code === 200 && response.data.data?.url) {
        const url = response.data.data.url;
        setMediaUrl(url);
        setPreviewUrl(url);
        showSuccess('上传成功');
      } else {
        showError(response.data.msg || '上传失败');
      }
    } catch (error) {
      showError('上传失败，请重试');
      console.error('上传错误:', error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      // 清空 input，允许重复选择同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // 处理 URL 输入
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setMediaUrl(url);
    setPreviewUrl(url);
  };

  // 开始分析
  const handleAnalyze = async () => {
    if (!mediaUrl) {
      showError('请先上传或输入媒体 URL');
      return;
    }

    try {
      setAnalyzing(true);
      setResult('');

      const params = { mediaUrl };
      const response = mediaType === 'image'
        ? await imagePromptReverse(params)
        : await videoPromptReverse(params);

      if (response.code === 200 && response.data) {
        setResult(response.data);
        showSuccess('分析完成');
      } else {
        showError(response.msg || '分析失败');
      }
    } catch (error) {
      showError('分析失败，请重试');
      console.error('分析错误:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // 复制结果
  const handleCopyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      showSuccess('已复制到剪贴板');
    } catch (error) {
      showError('复制失败');
    }
  };

  // 清空结果
  const handleClear = () => {
    setMediaUrl('');
    setPreviewUrl('');
    setResult('');
  };

  return (
    <div className="media-reverse-page">
      {/* 顶部导航栏 */}
      <header className="page-header">
        <button onClick={handleBack} className="back-button">
          ← 返回工作台
        </button>
        <h1 className="page-title">媒体反推</h1>
        <div style={{ width: '120px' }}></div>
      </header>

      {/* 主内容区域 */}
      <main className="page-content">
        <div className="content-wrapper">
          {/* 类型切换 */}
          <div className="type-switch">
            <button
              className={`type-btn ${mediaType === 'image' ? 'active' : ''}`}
              onClick={() => handleTypeChange('image')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              图片反推
            </button>
            <button
              className={`type-btn ${mediaType === 'video' ? 'active' : ''}`}
              onClick={() => handleTypeChange('video')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
              视频反推
            </button>
          </div>

          {/* 上传区域 */}
          <div className="upload-section">
            <div
              className={`upload-area ${uploading ? 'uploading' : ''}`}
              onClick={triggerFileSelect}
            >
              {uploading ? (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span>{uploadProgress}%</span>
                </div>
              ) : previewUrl ? (
                <div className="preview-container">
                  {mediaType === 'image' ? (
                    <img src={previewUrl} alt="预览" className="preview-image" />
                  ) : (
                    <video src={previewUrl} className="preview-video" controls />
                  )}
                  <div className="preview-overlay">
                    <span>点击更换</span>
                  </div>
                </div>
              ) : (
                <div className="upload-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>点击上传{mediaType === 'image' ? '图片' : '视频'}</span>
                  <span className="upload-hint">
                    支持 {mediaType === 'image' ? 'JPG、PNG、GIF、WebP' : 'MP4、MOV、AVI、WebM'}
                  </span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={mediaType === 'image' ? 'image/*' : 'video/*'}
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {/* URL 输入 */}
            <div className="url-input-group">
              <span className="url-label">或输入 URL：</span>
              <input
                type="text"
                className="url-input"
                placeholder={`输入${mediaType === 'image' ? '图片' : '视频'} URL`}
                value={mediaUrl}
                onChange={handleUrlChange}
              />
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="action-buttons">
            <button
              className="analyze-btn"
              onClick={handleAnalyze}
              disabled={!mediaUrl || analyzing}
            >
              {analyzing ? (
                <>
                  <span className="loading-spinner"></span>
                  分析中...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  开始分析
                </>
              )}
            </button>
            {(mediaUrl || result) && (
              <button className="clear-btn" onClick={handleClear}>
                清空
              </button>
            )}
          </div>

          {/* 结果展示 */}
          {result && (
            <div className="result-section">
              <div className="result-header">
                <h3>分析结果</h3>
                <button className="copy-btn" onClick={handleCopyResult}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  复制
                </button>
              </div>
              <div className="result-content">
                <pre>{result}</pre>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MediaReversePage;
