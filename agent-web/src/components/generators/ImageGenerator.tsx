/**
 * 图像生成组件 - 两栏布局版本
 * 左侧：生成表单
 * 右侧：历史记录
 *
 * 自动根据是否有参考图选择文生图或图生图
 */

import React, { useState, useEffect, useRef } from 'react';
import { generateImageFromImage, generateImageFromText } from '../../api/imageGeneration';
import type { TextToImageParams, ImageToImageParams } from '../../api/imageGeneration';
import MyImageHistory from '../history/MyImageHistory';
import { getImageEnums, type ImageEnums } from '../../api/enums';
import { useAuth } from '../../hooks/useAuth';
import { upload, showSuccess } from '../../utils/request';

interface ImageGeneratorProps {
    onGenerated?: (imageUrl: string) => void;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = () => {
    const { refreshUserInfo } = useAuth();

    // 状态管理
    const [prompt, setPrompt] = useState('');
    const [referenceImages, setReferenceImages] = useState<string[]>([]);
    const [style, setStyle] = useState<string>(''); // 风格选择
    const [aspectRatio, setAspectRatio] = useState<string>('auto');
    const [imageSize, setImageSize] = useState<string>('1K');

    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState('');
    const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const MAX_IMAGES = 5;

    // 枚举数据
    const [enums, setEnums] = useState<ImageEnums>({
        models: [],
        aspectRatios: [],
        sizes: [],
        styles: []
    });
    const [enumsLoading, setEnumsLoading] = useState(true);

    /**
     * 加载枚举数据
     */
    useEffect(() => {
        const loadEnums = async () => {
            try {
                setEnumsLoading(true);
                const data = await getImageEnums();
                // 确保数据完整性
                if (data && typeof data === 'object') {
                    setEnums({
                        models: data.models || [],
                        aspectRatios: data.aspectRatios || [],
                        sizes: data.sizes || [],
                        styles: data.styles || []
                    });
                } else {
                    console.error('API返回的数据格式不正确:', data);
                    setError('加载配置失败，数据格式错误');
                }
            } catch (err) {
                console.error('加载枚举失败:', err);
                setError('加载配置失败，请刷新页面');
            } finally {
                setEnumsLoading(false);
            }
        };
        loadEnums();
    }, []);

    /**
     * 触发历史记录刷新
     */
    const triggerHistoryRefresh = () => {
        setRefreshHistoryTrigger(prev => prev + 1);
    };

    /**
     * 构建最终的提示词（包含风格）
     */
    const buildFinalPrompt = (): string => {
        let finalPrompt = prompt.trim();

        // 如果选择了风格，添加到提示词中
        if (style) {
            finalPrompt = `${finalPrompt}, ${style} style`;
        }

        return finalPrompt;
    };

    /**
     * 处理生成图片
     * 自动判断是文生图还是图生图
     */
    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError('');
            setStatus('');

            // 构建最终提示词
            const finalPrompt = buildFinalPrompt();

            // 判断是否有参考图
            const hasReferenceImages = referenceImages.length > 0;

            if (hasReferenceImages) {
                // 有参考图 -> 调用图生图
                setStatus('调用图生图接口...');
                const imageToImageParams: ImageToImageParams = {
                    prompt: finalPrompt,
                    imageUrls: referenceImages,
                    aspectRatio: aspectRatio as 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9',
                    imageSize: imageSize as '1K' | '2K' | '4K',
                };
                await generateImageFromImage(
                    imageToImageParams,
                    (status) => {
                        setStatus(status);
                    }
                );
            } else {
                // 无参考图 -> 调用文生图
                setStatus('调用文生图接口...');
                const textToImageParams: TextToImageParams = {
                    prompt: finalPrompt,
                    aspectRatio: aspectRatio as 'auto' | '1:1' | '2:3' | '3:2' | '3:4' | '4:3' | '4:5' | '5:4' | '9:16' | '16:9' | '21:9',
                    imageSize: imageSize as '1K' | '2K' | '4K',
                };
                await generateImageFromText(
                    textToImageParams,
                    (status) => {
                        setStatus(status);
                    }
                );
            }

            setStatus('✅ 任务已提交，请在历史记录中查看进度');
            // 刷新历史记录列表
            triggerHistoryRefresh();
            // 刷新用户积分
            refreshUserInfo();

        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '生成失败';
            setError(errorMsg);
            setStatus('');
        } finally {
            setLoading(false);
        }
    };

    /**
     * 处理文件选择
     */
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 检查是否已达到最大数量
        if (referenceImages.length >= MAX_IMAGES) {
            setError(`最多只能上传 ${MAX_IMAGES} 张图片`);
            return;
        }

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            setError('请选择图片文件');
            return;
        }

        // 验证文件大小 (10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('图片大小不能超过 10MB');
            return;
        }

        try {
            setUploading(true);
            setError('');

            const response = await upload<{ code: number; data: { url: string } }>(
                '/api/file/upload',
                file
            );

            if (response.data.code === 200 && response.data.data?.url) {
                const newImages = [...referenceImages, response.data.data.url];
                setReferenceImages(newImages);
                showSuccess('图片上传成功');
            } else {
                throw new Error('上传失败');
            }
        } catch (err) {
            console.error('图片上传失败:', err);
            setError(err instanceof Error ? err.message : '上传失败');
        } finally {
            setUploading(false);
            // 清空 input，允许重复上传同一文件
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    /**
     * 删除参考图
     */
    const handleRemoveReferenceImage = (index: number) => {
        setReferenceImages(referenceImages.filter((_, i) => i !== index));
    };

    /**
     * 验证表单
     */
    const isFormValid = () => {
        return prompt.trim().length > 0;
    };

    return (
        <div className="image-generator" style={generatorStyles.mainContainer}>
            {/* 左侧:表单区域 */}
            <div style={generatorStyles.leftPanel}>
                <h2 style={generatorStyles.title}>AI 图像生成</h2>
    
                {/* 加载状态 */}
                {enumsLoading ? (
                    <div style={{
                        padding: '40px',
                        textAlign: 'center',
                        color: '#00d4ff'
                    }}>
                        <div>⏳ 加载配置中...</div>
                    </div>
                ) : (
                    <>

                {/* 提示词输入 */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#888', fontSize: '13px' }}>
                        提示词 *
                    </label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="描述你想要生成的图片"
                        rows={3}
                        style={{
                            width: '100%',
                            padding: '12px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            backgroundColor: '#0d0d0d',
                            color: '#e0e0e0',
                            border: '1px solid #222',
                            boxSizing: 'border-box',
                            transition: 'border-color 0.2s ease',
                        }}
                        disabled={loading}
                    />
                    <small style={{ color: '#444', fontSize: '11px' }}>
                        提供详细的描述可以获得更好的效果
                    </small>
                </div>

                {/* 风格选择 */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#888', fontSize: '13px' }}>
                        风格
                    </label>
                    <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        disabled={loading || enumsLoading}
                        style={{
                            width: '100%',
                            padding: '10px 12px',
                            fontSize: '14px',
                            borderRadius: '6px',
                            backgroundColor: '#0d0d0d',
                            color: '#e0e0e0',
                            border: '1px solid #222',
                            boxSizing: 'border-box',
                            cursor: 'pointer',
                        }}
                    >
                        {enums?.styles?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    {style && (
                        <small style={{ color: '#00d4ff', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                            将会添加 "{style} style" 到提示词中
                        </small>
                    )}
                </div>

                {/* 参考图（可选） */}
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#888', fontSize: '13px' }}>
                        参考图 ({referenceImages.length}/{MAX_IMAGES})
                    </label>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading || loading || referenceImages.length >= MAX_IMAGES}
                        style={{ display: 'none' }}
                    />

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || loading || referenceImages.length >= MAX_IMAGES}
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px dashed #00d4ff',
                            backgroundColor: 'transparent',
                            color: uploading || loading || referenceImages.length >= MAX_IMAGES ? '#444' : '#00d4ff',
                            cursor: uploading || loading || referenceImages.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
                            fontWeight: '500',
                            fontSize: '13px',
                            opacity: uploading || loading || referenceImages.length >= MAX_IMAGES ? 0.4 : 1,
                            transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (!uploading && !loading && referenceImages.length < MAX_IMAGES) {
                                e.currentTarget.style.backgroundColor = 'rgba(0, 212, 255, 0.1)';
                                e.currentTarget.style.borderStyle = 'solid';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!uploading && !loading && referenceImages.length < MAX_IMAGES) {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderStyle = 'dashed';
                            }
                        }}
                    >
                        {uploading ? '上传中...' : '+ 添加图片'}
                    </button>

                    {referenceImages.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                            {referenceImages.map((url, index) => (
                                <div
                                    key={index}
                                    style={{
                                        position: 'relative',
                                        width: '80px',
                                        height: '80px',
                                        border: '1px solid #222',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        background: '#0d0d0d',
                                    }}
                                >
                                    <img
                                        src={url}
                                        alt={`参考图 ${index + 1}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij7lm77niYfliqDovb3lpLHotKU88L3RleHQ+PC9zdmc+';
                                        }}
                                    />
                                    <button
                                        onClick={() => handleRemoveReferenceImage(index)}
                                        disabled={loading}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: 'rgba(255, 50, 50, 0.9)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '20px',
                                            height: '20px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontSize: '14px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            opacity: loading ? 0.5 : 1,
                                        }}
                                        title="删除"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {referenceImages.length < MAX_IMAGES && (
                        <small style={{ color: '#888', display: 'block', marginTop: '4px', fontSize: '11px' }}>
                            支持 JPG、PNG 等图片格式，大小不超过 10MB
                        </small>
                    )}

                    {referenceImages.length > 0 && (
                        <small style={{ color: '#00d4ff', display: 'block', marginTop: '8px', fontSize: '11px' }}>
                            已添加 {referenceImages.length} 张参考图，将使用图生图模式
                        </small>
                    )}
                </div>

                {/* 宽高比和分辨率 - 并排显示 */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    {/* 宽高比 */}
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#888', fontSize: '13px' }}>宽高比</label>
                        <select
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            disabled={loading || enumsLoading}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#0d0d0d',
                                color: '#e0e0e0',
                                border: '1px solid #222',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                cursor: 'pointer',
                            }}
                        >
                            {enums?.aspectRatios?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 分辨率 */}
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#888', fontSize: '13px' }}>分辨率</label>
                        <select
                            value={imageSize}
                            onChange={(e) => setImageSize(e.target.value)}
                            disabled={loading || enumsLoading}
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                borderRadius: '6px',
                                backgroundColor: '#0d0d0d',
                                color: '#e0e0e0',
                                border: '1px solid #222',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                cursor: 'pointer',
                            }}
                        >
                            {enums?.sizes?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 生成按钮 */}
                <button
                    onClick={handleGenerate}
                    disabled={loading || !isFormValid()}
                    style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        backgroundColor: loading || !isFormValid() ? '#333' : '#00d4ff',
                        color: loading || !isFormValid() ? '#666' : '#000',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading || !isFormValid() ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: loading || !isFormValid() ? 0.4 : 1,
                        letterSpacing: '1px',
                    }}
                    onMouseEnter={(e) => {
                        if (!loading && isFormValid()) {
                            e.currentTarget.style.background = '#00e8ff';
                            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 212, 255, 0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (!loading && isFormValid()) {
                            e.currentTarget.style.background = '#00d4ff';
                            e.currentTarget.style.boxShadow = 'none';
                        }
                    }}
                >
                    {loading ? '提交中...' : referenceImages.length > 0 ? '图生图' : '文生图'}
                </button>

                {/* 最终提示词预览 */}
                {(prompt || style) && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        backgroundColor: '#0d0d0d',
                        borderRadius: '6px',
                        fontSize: '12px',
                        border: '1px solid #222'
                    }}>
                        <strong style={{ color: '#888' }}>提示词：</strong>
                        <div style={{ marginTop: '4px', color: '#666', fontStyle: 'italic', fontSize: '11px' }}>
                            "{buildFinalPrompt()}"
                        </div>
                    </div>
                )}

                {/* 状态显示 */}
                {status && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(0, 212, 255, 0.1)',
                        color: '#00d4ff',
                        borderRadius: '6px',
                        border: '1px solid rgba(0, 212, 255, 0.3)',
                        fontSize: '13px',
                    }}>
                        {status}
                    </div>
                )}

                {/* 错误显示 */}
                {error && (
                    <div style={{
                        marginTop: '12px',
                        padding: '10px 12px',
                        backgroundColor: 'rgba(255, 50, 50, 0.1)',
                        color: '#ff6b6b',
                        borderRadius: '6px',
                        border: '1px solid rgba(255, 50, 50, 0.3)',
                        fontSize: '13px',
                    }}>
                        {error}
                    </div>
                )}
                </>
            )}
            </div>

            {/* 右侧：历史记录 */}
            <div style={generatorStyles.rightPanel}>
                <MyImageHistory refreshTrigger={refreshHistoryTrigger} />
            </div>
        </div>
    );
};

// 生成器样式 - 简约黑色科技风
const generatorStyles = {
    mainContainer: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        padding: '20px',
        height: 'calc(100vh - 68px)',
        backgroundColor: '#0a0a0a',
        color: '#e0e0e0',
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        overflow: 'hidden',
    } as React.CSSProperties,

    leftPanel: {
        overflowY: 'auto' as const,
        paddingRight: '12px',
        height: '100%',
        scrollbarWidth: 'thin' as const,
        background: '#111',
        borderRadius: '8px',
        padding: '20px',
        border: '1px solid #1a1a1a',
    } as React.CSSProperties,

    rightPanel: {
        overflowY: 'auto' as const,
        borderLeft: 'none',
        paddingLeft: '0',
        height: '100%',
        scrollbarWidth: 'thin' as const,
        background: '#111',
        borderRadius: '8px',
        border: '1px solid #1a1a1a',
    } as React.CSSProperties,

    title: {
        margin: '0 0 16px 0',
        fontSize: '16px',
        fontWeight: '600',
        color: '#00d4ff',
        letterSpacing: '1px',
    },
};

export default ImageGenerator;

// 添加全局样式支持
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @media (max-width: 1200px) {
            .image-generator {
                grid-template-columns: 1fr !important;
            }
        }

        option {
            background-color: #111;
            color: #e0e0e0;
        }
    `;
    document.head.appendChild(styleSheet);
}
