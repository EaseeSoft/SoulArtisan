import React, {useEffect, useState} from 'react';
import {getTaskList, deleteTask, getTaskStatus} from '../../api/videoGeneration';
import type {VideoTask} from '../../api/videoGeneration';
import { showWarning, showSuccess } from '../../utils/request';
import './MyVideoHistory.css';

// 复制到剪贴板辅助函数
const copyToClipboard = async (text: string, onSuccess: () => void, onError: () => void) => {
    try {
        await navigator.clipboard.writeText(text);
        onSuccess();
    } catch (error) {
        console.error('复制失败:', error);
        // 降级方案：使用传统方法
        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            onSuccess();
        } catch {
            onError();
        }
    }
};

const MyVideoHistory: React.FC = () => {
    const [tasks, setTasks] = useState<VideoTask[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [refreshingTaskId, setRefreshingTaskId] = useState<number | null>(null);
    const pageSize = 12;

    const fetchTasks = async (page: number) => {
        setLoading(true);
        try {
            const params: {
                page: number;
                page_size: number;
                status?: string;
            } = {
                page,
                page_size: pageSize,
            };

            if (filterStatus) {
                params.status = filterStatus;
            }

            const result = await getTaskList(params);
            if (result.code === 200) {
                setTasks(result.data.list);
                setTotal(result.data.total);
            }
        } catch (error) {
            console.error('获取任务列表失败:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks(currentPage);
    }, [currentPage, filterStatus]);

    // 自动刷新未完成的任务
    useEffect(() => {
        const hasUncompletedTasks = tasks.some(
            task => task.status === 'pending' || task.status === 'running'
        );

        if (!hasUncompletedTasks) {
            return;
        }

        const pollInterval = setInterval(() => {
            fetchTasks(currentPage);
        }, 5000); // 每5秒刷新一次

        return () => clearInterval(pollInterval);
    }, [tasks, currentPage]);

    const handleDelete = async (taskId: number) => {
        if (!confirm('确定要删除这个任务吗？')) {
            return;
        }

        try {
            await deleteTask(taskId);
            fetchTasks(currentPage);
            showSuccess('删除成功');
        } catch (error) {
            console.error('删除任务失败:', error);
            showWarning('删除失败');
        }
    };

    // 刷新单个任务状态
    const handleRefreshTask = async (taskId: number) => {
        setRefreshingTaskId(taskId);
        try {
            const result = await getTaskStatus(taskId);
            if (result.code === 200 && result.data) {
                // 更新列表中对应任务的状态
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === taskId ? {...task, ...result.data} : task
                    )
                );
                showSuccess('状态已更新');
            } else {
                showWarning(result.msg || '刷新失败');
            }
        } catch (error) {
            console.error('刷新任务状态失败:', error);
            showWarning('刷新失败');
        } finally {
            setRefreshingTaskId(null);
        }
    };

    const getStatusText = (status: string) => {
        const statusMap: Record<string, string> = {
            pending: '待处理',
            running: '生成中',
            succeeded: '已完成',
            error: '失败',
        };
        return statusMap[status] || status;
    };

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="video-history">
            <div className="video-history-header">
                <h2>视频历史记录</h2>

                {/* 状态筛选 */}
                <div className="video-history-filter">
                    <label>状态筛选：</label>
                    <select
                        value={filterStatus}
                        onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">全部</option>
                        <option value="pending">待处理</option>
                        <option value="running">生成中</option>
                        <option value="succeeded">已完成</option>
                        <option value="error">失败</option>
                    </select>
                </div>
            </div>

            {loading && tasks.length === 0 ? (
                <div className="video-history-empty">
                    加载中...
                </div>
            ) : tasks.length === 0 ? (
                <div className="video-history-empty">
                    暂无记录
                </div>
            ) : (
                <>
                    {/* 任务列表 */}
                    <div className="video-history-grid">
                        {tasks.map((task) => (
                            <div key={task.id} className="video-history-card">
                                {/* 视频预览 */}
                                <div className="video-preview-container">
                                    {task.status === 'succeeded' && task.resultUrl ? (
                                        <video
                                            src={task.resultUrl}
                                            controls
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div className="video-preview-placeholder">
                                            {task.status === 'pending' && '⏱️ 等待处理'}
                                            {task.status === 'running' && `🎬 生成中 ${task.progress}%`}
                                            {task.status === 'error' && '❌ 生成失败'}
                                        </div>
                                    )}

                                    {/* 状态标签 */}
                                    <div className={`video-status-badge video-status-${task.status}`}>
                                        {getStatusText(task.status)}
                                    </div>

                                    {/* 错误信息 - 显示在预览区域内 */}
                                    {task.status === 'error' && task.errorMessage && (
                                        <div className="video-preview-error-message">
                                            {task.errorMessage}
                                        </div>
                                    )}
                                </div>

                                {/* 任务信息 */}
                                <div className="video-card-body">
                                    {/* 提示词区域 */}
                                    <div className="video-card-prompt-wrapper">
                                        <div className="video-card-prompt" title={task.prompt}>
                                            {task.prompt}
                                        </div>
                                        <button
                                            className="video-copy-button"
                                            onClick={() => copyToClipboard(
                                                task.prompt,
                                                () => showSuccess('提示词已复制'),
                                                () => showWarning('复制失败')
                                            )}
                                            title="复制提示词"
                                        >
                                            📋
                                        </button>
                                    </div>

                                    {/* 参考图 */}
                                    {task.imageUrls && task.imageUrls.length > 0 && (
                                        <div className="video-ref-images">
                                            <div className="video-ref-label">参考图：</div>
                                            <div className="video-ref-image-list">
                                                {task.imageUrls.map((url, index) => (
                                                    <img
                                                        key={index}
                                                        src={url}
                                                        alt={`参考图${index + 1}`}
                                                        className="video-ref-image"
                                                        onClick={() => window.open(url, '_blank')}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* <div className="video-card-info">
                                        模型: {task.model}
                                    </div> */}

                                    <div className="video-card-info">
                                        尺寸: {task.aspectRatio} | 时长: {task.duration}秒
                                    </div>

                                    <div className="video-card-time">
                                        {new Date(task.createdAt).toLocaleString()}
                                    </div>

                                    {/* 操作按钮 */}
                                    <div className="video-card-actions">
                                        {task.status === 'succeeded' && task.resultUrl && (
                                            <a
                                                href={task.resultUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="video-download-link"
                                            >
                                                下载
                                            </a>
                                        )}
                                        {task.status !== 'succeeded' && (
                                            <button
                                                onClick={() => handleRefreshTask(task.id)}
                                                className="video-refresh-button"
                                                disabled={refreshingTaskId === task.id}
                                            >
                                                {refreshingTaskId === task.id ? '刷新中...' : '刷新'}
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className={`video-delete-button ${task.status !== 'succeeded' ? 'video-delete-button-full' : ''}`}
                                        >
                                            删除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 分页 */}
                    {totalPages > 1 && (
                        <div className="video-pagination">
                            <button
                                onClick={() => setCurrentPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="video-pagination-button"
                            >
                                上一页
                            </button>

                            <span className="video-pagination-info">
                                第 {currentPage} / {totalPages} 页
                            </span>

                            <button
                                onClick={() => setCurrentPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="video-pagination-button"
                            >
                                下一页
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MyVideoHistory;
