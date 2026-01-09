import React, {useState, useEffect, useRef} from 'react';
import {generateVideo} from '../../api/videoGeneration';
import type {CreateVideoParams} from '../../api/videoGeneration';
import { getVideoEnums, type VideoEnums } from '../../api/enums';
import { useAuth } from '../../hooks/useAuth';
import { upload } from '../../utils/request';
import { showSuccess } from '../../utils/request';
import './VideoGenerator.css';

interface VideoGeneratorProps {
    onGenerated?: () => void;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onGenerated }) => {
    const { refreshUserInfo } = useAuth();

    const [prompt, setPrompt] = useState('');
    const [style, setStyle] = useState<string>(''); // 风格选择
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [duration, setDuration] = useState<number>(10);
    const [imageUrl, setImageUrl] = useState<string>('');
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 枚举数据
    const [enums, setEnums] = useState<VideoEnums>({
        models: [],
        aspectRatios: [],
        durations: [],
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
                const data = await getVideoEnums();
                // 确保数据完整性
                if (data && typeof data === 'object') {
                    setEnums({
                        models: data.models || [],
                        aspectRatios: data.aspectRatios || [],
                        durations: data.durations || [],
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
     * 处理文件选择
     */
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
                setImageUrl(response.data.data.url);
                showSuccess('图片上传成功');
            } else {
                throw new Error('上传失败');
            }
        } catch (err) {
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
     * 删除已上传的图片
     */
    const handleRemoveImage = () => {
        setImageUrl('');
    };

    /**
     * 构建最终的提示词（包含风格）
     */
    const buildFinalPrompt = (): string => {
        let finalPrompt = prompt.trim();

        // 如果选择了风格，添加到提示词开头
        if (style) {
            finalPrompt = `${style} style, ${finalPrompt}`;
        }

        return finalPrompt;
    };

    const handleGenerate = async () => {
        const finalPrompt = buildFinalPrompt();
        if (!finalPrompt) {
            setError('请输入提示词');
            return;
        }

        setLoading(true);
        setError('');
        setStatus('');

        try {
            const params: CreateVideoParams = {
                prompt: finalPrompt,
                aspectRatio: aspectRatio as '16:9' | '9:16',
                duration: duration as 10 | 15 | 25,
            };

            if (imageUrl) {
                params.imageUrls = [imageUrl];
            }

            await generateVideo(params, (statusMsg) => {
                setStatus(statusMsg);
            });

            setStatus('任务已创建成功！请在历史记录中查看进度');

            // 重置表单
            setPrompt('');
            setImageUrl('');

            // 刷新用户积分
            refreshUserInfo();

            // 触发历史记录刷新
            if (onGenerated) {
                onGenerated();
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : '生成失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="video-generator">
            <h2>AI 视频生成</h2>

            {/* 加载状态 */}
            {enumsLoading ? (
                <div style={{
                    padding: '40px',
                    textAlign: 'center',
                    color: '#888'
                }}>
                    <div>加载配置中...</div>
                </div>
            ) : (
                <>

            {/* 提示词输入 */}
            <div className="video-form-group">
                <label className="video-form-label">
                    提示词 *
                </label>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="描述你想生成的视频内容，例如：一只小猫在草地上玩耍"
                    rows={4}
                    className="video-form-textarea"
                    disabled={loading || enumsLoading}
                />
            </div>

            {/* 风格选择 */}
            <div className="video-form-group">
                <label className="video-form-label">
                    风格
                </label>
                <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="video-form-select"
                    disabled={loading || enumsLoading}
                >
                    {enums?.styles?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {style && (
                    <small style={{ color: '#00d4ff', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                        将会在提示词开头添加 "{style} style"
                    </small>
                )}
            </div>

            {/* 宽高比和时长 */}
            <div className="video-form-row">
                <div className="video-form-col">
                    <label className="video-form-label">
                        宽高比
                    </label>
                    <select
                        value={aspectRatio}
                        onChange={(e) => setAspectRatio(e.target.value)}
                        className="video-form-select"
                        disabled={loading || enumsLoading}
                    >
                        {enums?.aspectRatios?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="video-form-col">
                    <label className="video-form-label">
                        时长（秒）
                    </label>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="video-form-select"
                        disabled={loading || enumsLoading}
                    >
                        {enums?.durations?.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 参考图 */}
            <div className="video-form-group">
                <label className="video-form-label">
                    参考图 (可选，仅支持一张)
                </label>

                {/* 文件上传按钮 */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading || loading || !!imageUrl}
                    style={{ display: 'none' }}
                    id="video-reference-image-upload"
                />
                {!imageUrl && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || loading}
                        className="video-upload-button"
                    >
                        {uploading ? '上传中...' : '选择图片'}
                    </button>
                )}

                {/* 显示已上传的图片 */}
                {imageUrl && (
                    <div className="video-image-preview-single">
                        <img
                            src={imageUrl}
                            alt="参考图"
                        />
                        <button
                            onClick={handleRemoveImage}
                            className="video-image-remove-button"
                            title="删除图片"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* 上传提示 */}
                {!imageUrl && !uploading && (
                    <small style={{ color: '#888', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                        支持 JPG、PNG 等图片格式，大小不超过 10MB
                    </small>
                )}
            </div>

            {/* 最终提示词预览 */}
            {(prompt || style) && (
                <div style={{
                    marginTop: '12px',
                    marginBottom: '12px',
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

            {/* 生成按钮 */}
            <button
                onClick={handleGenerate}
                disabled={loading || !prompt.trim()}
                className="video-generate-button"
            >
                {loading ? '生成中...' : '生成视频'}
            </button>

            {/* 状态显示 */}
            {status && (
                <div className="video-status-message">
                    {status}
                </div>
            )}

            {/* 错误显示 */}
            {error && (
                <div className="video-error-message">
                    {error}
                </div>
            )}
            </>
        )}
        </div>
    );
};

export default VideoGenerator;
