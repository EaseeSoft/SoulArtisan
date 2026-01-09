/**
 * 我的生图历史记录组件
 * 展示用户生成的所有图片任务，支持分页和筛选
 */

import React, { useState, useEffect } from 'react';

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
import type { ImageTask } from '../../api/imageGeneration';
import { getTaskList, deleteTask } from '../../api/imageGeneration';
import { showWarning, showSuccess } from '../../utils/request';

interface MyImageHistoryProps {
    refreshTrigger?: number; // 外部触发刷新的标志
}

const MyImageHistory: React.FC<MyImageHistoryProps> = ({ refreshTrigger = 0 }) => {
    // 分页状态
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 12;
    
    // 数据状态
    const [tasks, setTasks] = useState<ImageTask[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 筛选状态
    const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'processing' | 'failed'>('all');
    const [typeFilter, setTypeFilter] = useState<'all' | 'text2image' | 'image2image'>('all');

    // 轮询状态
    const [isPolling, setIsPolling] = useState(false);
    
    /**
     * 获取任务列表
     */
    const fetchTasks = async (page: number = 1) => {
        try {
            setLoading(true);
            setError('');
            
            const params: Record<string, string | number> = {
                page,
                page_size: pageSize,
            };
            
            if (statusFilter !== 'all') {
                params.status = statusFilter;
            }
            
            if (typeFilter !== 'all') {
                params.type = typeFilter;
            }

            const response = await getTaskList(params);
            
            if (response.code === 200 && response.data) {
                setTasks(response.data.list || []);
                setTotal(response.data.total || 0);
                setCurrentPage(page);
                
                // 检查是否有更多数据
                // const totalPages = Math.ceil((response.data.total || 0) / pageSize);
            } else {
                setError(response.msg || '获取列表失败');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '加载历史记录失败';
            setError(errorMsg);
            console.error('加载历史记录错误:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * 处理删除任务
     */
    const handleDeleteTask = async (taskId: number) => {
        if (!window.confirm('确定要删除这个任务记录吗？')) {
            return;
        }

        try {
            const response = await deleteTask(taskId);
            if (response.code === 200) {
                // 删除成功，刷新列表
                await fetchTasks(currentPage);
                showSuccess('删除成功');
            } else {
                showWarning(response.msg || '删除失败');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : '未知错误';
            showWarning('删除失败：' + errorMsg);
        }
    };

    /**
     * 处理分页变化
     */
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= Math.ceil(total / pageSize)) {
            fetchTasks(newPage);
        }
    };

    /**
     * 处理筛选变化
     */
    const handleStatusFilterChange = (status: 'all' | 'completed' | 'processing' | 'failed') => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const handleTypeFilterChange = (type: 'all' | 'text2image' | 'image2image') => {
        setTypeFilter(type);
        setCurrentPage(1);
    };

    /**
     * 获取状态显示文本
     */
    const getStatusDisplay = (status: string) => {
        const statusMap: Record<string, { text: string; color: string }> = {
            'pending': { text: '待处理', color: '#FFA500' },
            'processing': { text: '处理中', color: '#007bff' },
            'completed': { text: '已完成', color: '#28a745' },
            'failed': { text: '失败', color: '#dc3545' },
        };
        return statusMap[status] || { text: status, color: '#999' };
    };

    /**
     * 获取类型显示文本
     */
    const getTypeDisplay = (type: string) => {
        const typeMap: Record<string, string> = {
            'text2image': '文生图',
            'image2image': '图生图',
        };
        return typeMap[type] || type;
    };

    /**
     * 格式化日期
     */
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });
        } catch {
            return dateString;
        }
    };

    // 初始加载及筛选条件变化时重新加载
    useEffect(() => {
        fetchTasks(1);
    }, [statusFilter, typeFilter]);

    // 刷新触发器
    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchTasks(1);
        }
    }, [refreshTrigger]);

    // 自动轮询未完成任务
    useEffect(() => {
        // 检查是否有未完成的任务
        const hasUncompletedTasks = tasks.some(
            task => task.status === 'pending' || task.status === 'processing'
        );

        if (!hasUncompletedTasks) {
            setIsPolling(false);
            return;
        }

        // 设置轮询状态
        setIsPolling(true);

        // 每 3 秒刷新一次列表
        const pollInterval = setInterval(() => {
            fetchTasks(currentPage);
        }, 3000);

        // 清理定时器
        return () => {
            clearInterval(pollInterval);
        };
    }, [tasks, currentPage]);

    const totalPages = Math.ceil(total / pageSize);

    return (
        <div style={styles.container}>
            {/* 标题 */}
            <div style={styles.header}>
                <h3 style={styles.title}>
                    我的生图记录
                    {isPolling && (
                        <span style={styles.pollingIndicator} title="正在自动刷新未完成任务">
                            刷新中...
                        </span>
                    )}
                </h3>
                <div style={styles.total}>共 {total} 个任务</div>
            </div>

            {/* 筛选器 */}
            <div style={styles.filterSection}>
                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>状态：</label>
                    <div style={styles.filterButtons}>
                        {(['all', 'completed', 'processing', 'failed'] as const).map((status) => (
                            <button
                                key={status}
                                onClick={() => handleStatusFilterChange(status)}
                                style={{
                                    ...styles.filterButton,
                                    ...(statusFilter === status ? styles.filterButtonActive : {}),
                                }}
                            >
                                {status === 'all' ? '全部' : getStatusDisplay(status).text}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={styles.filterGroup}>
                    <label style={styles.filterLabel}>类型：</label>
                    <div style={styles.filterButtons}>
                        {(['all', 'text2image', 'image2image'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => handleTypeFilterChange(type)}
                                style={{
                                    ...styles.filterButton,
                                    ...(typeFilter === type ? styles.filterButtonActive : {}),
                                }}
                            >
                                {type === 'all' ? '全部' : getTypeDisplay(type)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 错误提示 */}
            {error && (
                <div style={styles.errorContainer}>
                    错误：{error}
                </div>
            )}

            {/* 列表容器 */}
            <div style={styles.listContainer}>
                {loading && tasks.length === 0 ? (
                    <div style={styles.loading}>
                        <div style={styles.spinner}></div>
                        <p>加载中...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div style={styles.empty}>
                        <div style={styles.emptyIcon}>—</div>
                        <p>暂无生图记录</p>
                        <small>开始生成图片后，记录将显示在这里</small>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {tasks.map((task) => {
                            const statusDisplay = getStatusDisplay(task.status);
                            
                            return (
                                <div key={task.id} style={styles.card}>
                                    {/* 图片部分 */}
                                    <div style={styles.cardImage}>
                                        {task.resultUrl ? (
                                            <img
                                                src={task.resultUrl}
                                                alt="Generated"
                                                style={styles.image}
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src =
                                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij7nhLHluplduOaWh+iwg+eJh++8iDwvdGV4dD48L3N2Zz4=';
                                                }}
                                            />
                                        ) : (
                                            <div style={styles.noImage}>
                                                <div style={styles.noImageIcon}>○</div>
                                                {task.status === 'failed' ? (
                                                    <span>失败</span>
                                                ) : (
                                                    <span>处理中</span>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* 状态徽章 */}
                                        <div
                                            style={{
                                                ...styles.statusBadge,
                                                backgroundColor: statusDisplay.color,
                                            }}
                                        >
                                            {statusDisplay.text}
                                        </div>
                                    </div>

                                    {/* 信息部分 */}
                                    <div style={styles.cardInfo}>
                                        {/* 提示词区域 */}
                                        <div style={styles.promptWrapper}>
                                            <div style={styles.prompt} title={task.prompt}>
                                                {task.prompt}
                                            </div>
                                            <button
                                                style={styles.copyButton}
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
                                            <div style={styles.refImages}>
                                                <div style={styles.refLabel}>参考图：</div>
                                                <div style={styles.refImageList}>
                                                    {task.imageUrls.map((url, index) => (
                                                        <img
                                                            key={index}
                                                            src={url}
                                                            alt={`参考图${index + 1}`}
                                                            style={styles.refImage}
                                                            onClick={() => window.open(url, '_blank')}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 元数据 */}
                                        <div style={styles.metadata}>
                                            <div style={styles.metaItem}>
                                                <span style={styles.metaLabel}>类型：</span>
                                                <span>{getTypeDisplay(task.type)}</span>
                                            </div>
                                            <div style={styles.metaItem}>
                                                <span style={styles.metaLabel}>模型：</span>
                                                <span style={styles.modelName}>{task.model.split('-').pop()}</span>
                                            </div>
                                        </div>

                                        {/* 时间 */}
                                        <div style={styles.time}>
                                            {formatDate(task.createdAt)}
                                        </div>

                                        {/* 错误信息 */}
                                        {task.errorMessage && (
                                            <div style={styles.errorMsg} title={task.errorMessage}>
                                                {task.errorMessage}
                                            </div>
                                        )}

                                        {/* 操作按钮 */}
                                        <div style={styles.actions}>
                                            {task.resultUrl && (
                                                <a
                                                    href={task.resultUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={styles.actionButton}
                                                >
                                                    查看
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                style={styles.deleteButton}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* 分页控制 */}
            {total > 0 && totalPages > 1 && (
                <div style={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                            ...styles.paginationButton,
                            ...(currentPage === 1 ? styles.paginationButtonDisabled : {}),
                        }}
                    >
                        上一页
                    </button>

                    <div style={styles.pageInfo}>
                        第 {currentPage} / {totalPages} 页
                    </div>

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                            ...styles.paginationButton,
                            ...(currentPage === totalPages ? styles.paginationButtonDisabled : {}),
                        }}
                    >
                        下一页
                    </button>
                </div>
            )}

            {loading && tasks.length > 0 && (
                <div style={styles.loadingMore}>加载中...</div>
            )}
        </div>
    );
};

// 简约黑色科技风格样式
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column' as const,
        backgroundColor: 'transparent',
        color: '#e0e0e0',
        borderRadius: '0px',
        padding: '16px',
        border: 'none',
        boxShadow: 'none',
        overflow: 'visible',
    },

    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #1a1a1a',
    },

    title: {
        margin: '0',
        fontSize: '14px',
        fontWeight: '600',
        color: '#00d4ff',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        letterSpacing: '0.5px',
    },

    pollingIndicator: {
        display: 'inline-block',
        fontSize: '10px',
        color: '#00d4ff',
        opacity: 0.7,
    },

    total: {
        fontSize: '11px',
        color: '#666',
    },

    filterSection: {
        marginBottom: '16px',
        padding: '12px',
        backgroundColor: '#0d0d0d',
        borderRadius: '6px',
        border: '1px solid #1a1a1a',
    },

    filterGroup: {
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap' as const,
        gap: '8px',
    },

    filterLabel: {
        fontSize: '12px',
        fontWeight: '500',
        color: '#666',
        minWidth: '45px',
    },

    filterButtons: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap' as const,
    },

    filterButton: {
        padding: '5px 10px',
        fontSize: '11px',
        backgroundColor: 'transparent',
        color: '#666',
        border: '1px solid #222',
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
    } as React.CSSProperties,

    filterButtonActive: {
        backgroundColor: '#00d4ff',
        color: '#000',
        borderColor: '#00d4ff',
    },

    listContainer: {
        marginBottom: '16px',
        paddingRight: '5px',
        overflow: 'visible',
    } as React.CSSProperties,

    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '12px',
    },

    card: {
        backgroundColor: '#111',
        border: '1px solid #1a1a1a',
        borderRadius: '6px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column' as const,
        transition: 'border-color 0.2s ease',
    },

    cardImage: {
        position: 'relative' as const,
        width: '100%',
        paddingBottom: '100%',
        backgroundColor: '#0d0d0d',
        overflow: 'hidden',
    },

    image: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },

    noImage: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0d0d0d',
        color: '#444',
        fontSize: '11px',
    },

    noImageIcon: {
        fontSize: '24px',
        marginBottom: '6px',
        opacity: 0.5,
    },

    statusBadge: {
        position: 'absolute' as const,
        top: '6px',
        right: '6px',
        padding: '3px 8px',
        fontSize: '10px',
        fontWeight: '600',
        borderRadius: '3px',
        color: 'white',
    },

    cardInfo: {
        flex: 1,
        padding: '10px',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'space-between',
    },

    prompt: {
        fontSize: '11px',
        color: '#888',
        lineHeight: '1.4',
        maxHeight: '36px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box' as const,
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
    },

    promptWrapper: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '6px',
        marginBottom: '8px',
    },

    copyButton: {
        flexShrink: 0,
        width: '22px',
        height: '22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 212, 255, 0.15)',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        borderRadius: '3px',
        cursor: 'pointer',
        fontSize: '11px',
        transition: 'all 0.2s ease',
        padding: '0',
    } as React.CSSProperties,

    refImages: {
        marginBottom: '8px',
        padding: '6px',
        background: 'rgba(13, 13, 13, 0.5)',
        borderRadius: '4px',
    },

    refLabel: {
        fontSize: '10px',
        color: '#666',
        marginBottom: '4px',
    },

    refImageList: {
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap' as const,
    },

    refImage: {
        width: '35px',
        height: '35px',
        objectFit: 'cover' as const,
        borderRadius: '3px',
        cursor: 'pointer',
        border: '1px solid rgba(0, 212, 255, 0.3)',
        transition: 'all 0.2s ease',
    } as React.CSSProperties,

    metadata: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '3px',
        marginBottom: '6px',
        paddingBottom: '6px',
        borderBottom: '1px solid #1a1a1a',
    },

    metaItem: {
        fontSize: '10px',
        color: '#555',
        display: 'flex',
        gap: '4px',
    },

    metaLabel: {
        color: '#666',
        fontWeight: '500',
    },

    modelName: {
        color: '#888',
    },

    time: {
        fontSize: '10px',
        color: '#444',
        marginBottom: '8px',
    },

    errorMsg: {
        fontSize: '10px',
        color: '#ff6b6b',
        marginBottom: '8px',
        padding: '4px 6px',
        backgroundColor: 'rgba(255, 50, 50, 0.1)',
        borderRadius: '3px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
    },

    actions: {
        display: 'flex',
        gap: '6px',
        marginTop: 'auto',
    },

    actionButton: {
        flex: 1,
        padding: '5px',
        fontSize: '10px',
        backgroundColor: 'transparent',
        color: '#00d4ff',
        border: '1px solid #00d4ff',
        borderRadius: '3px',
        cursor: 'pointer',
        textAlign: 'center' as const,
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'all 0.2s ease',
    },

    deleteButton: {
        flex: 1,
        padding: '5px',
        fontSize: '10px',
        backgroundColor: 'transparent',
        color: '#ff6b6b',
        border: '1px solid rgba(255, 50, 50, 0.3)',
        borderRadius: '3px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s ease',
    },

    loading: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '200px',
        color: '#444',
    },

    spinner: {
        width: '32px',
        height: '32px',
        border: '2px solid #1a1a1a',
        borderTop: '2px solid #00d4ff',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
        marginBottom: '12px',
    },

    empty: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        height: '250px',
        color: '#444',
    },

    emptyIcon: {
        fontSize: '36px',
        marginBottom: '12px',
        opacity: 0.3,
    },

    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '12px',
        paddingTop: '12px',
        borderTop: '1px solid #1a1a1a',
    },

    paginationButton: {
        padding: '6px 12px',
        fontSize: '11px',
        backgroundColor: 'transparent',
        color: '#00d4ff',
        border: '1px solid #00d4ff',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '500',
        transition: 'all 0.2s ease',
    },

    paginationButtonDisabled: {
        backgroundColor: 'transparent',
        color: '#333',
        borderColor: '#222',
        cursor: 'not-allowed',
        opacity: 0.5,
    },

    pageInfo: {
        fontSize: '11px',
        color: '#666',
        minWidth: '90px',
        textAlign: 'center' as const,
    },

    loadingMore: {
        textAlign: 'center' as const,
        padding: '12px',
        color: '#444',
        fontSize: '11px',
    },

    errorContainer: {
        marginBottom: '12px',
        padding: '10px 12px',
        backgroundColor: 'rgba(255, 50, 50, 0.1)',
        color: '#ff6b6b',
        borderRadius: '6px',
        border: '1px solid rgba(255, 50, 50, 0.3)',
        fontSize: '12px',
    },
};

// 添加 CSS 动画
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(styleSheet);

export default MyImageHistory;
