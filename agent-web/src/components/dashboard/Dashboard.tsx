import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { getPointsRecords, redeemCardKey, PointsRecord } from '../../api/user';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { logout, userInfo, refreshUserInfo } = useAuth();
  const { config: siteConfig } = useSiteConfig();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 积分详情模态框状态
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [pointsRecords, setPointsRecords] = useState<PointsRecord[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsPage, setPointsPage] = useState(1);
  const [pointsTotal, setPointsTotal] = useState(0);

  // 卡密充值模态框状态
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [cardCode, setCardCode] = useState('');
  const [rechargeLoading, setRechargeLoading] = useState(false);

  const displayUserName = userInfo?.nickname || userInfo?.username || '用户';
  const userCredits = userInfo?.points || 0;

  const handleMouseEnter = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setShowUserMenu(true);
  };

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setShowUserMenu(false);
    }, 200);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSoraWorkflow = () => {
    navigate('/workflow-projects');
  };

  const handleScriptManager = () => {
    navigate('/scripts');
  };

  const handleImageGenerator = () => {
    navigate('/image-generator');
  };

  const handleVideoGenerator = () => {
    navigate('/video-generator');
  };

  const handleImageReverse = () => {
    navigate('/media-reverse');
  };

  const handleAccountSettings = () => {
    navigate('/account-settings');
  };

  const handleStoryboardCut = () => {
    navigate('/storyboard-cut');
  };

  const handleCharacterProjects = () => {
    navigate('/character-projects');
  };

  // 获取积分记录
  const fetchPointsRecords = async (page: number = 1) => {
    setPointsLoading(true);
    try {
      const response = await getPointsRecords(page, 10);
      if (response.code === 200) {
        setPointsRecords(response.data.list || []);
        setPointsTotal(response.data.total || 0);
        setPointsPage(page);
      } else {
        toast.error(response.msg || '获取积分记录失败');
      }
    } catch {
      toast.error('获取积分记录失败');
    } finally {
      setPointsLoading(false);
    }
  };

  // 打开积分详情模态框
  const handleOpenPointsModal = () => {
    setShowPointsModal(true);
    fetchPointsRecords(1);
  };

  // 卡密充值
  const handleRecharge = async () => {
    if (!cardCode.trim()) {
      toast.error('请输入卡密');
      return;
    }

    setRechargeLoading(true);
    try {
      const response = await redeemCardKey(cardCode.trim());
      if (response.code === 200) {
        toast.success(`充值成功！获得 ${response.data.points} 积分`);
        setCardCode('');
        setShowRechargeModal(false);
        // 刷新用户信息
        await refreshUserInfo();
      } else {
        toast.error(response.msg || '充值失败');
      }
    } catch {
      toast.error('充值失败，请稍后重试');
    } finally {
      setRechargeLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 关闭模态框时重置
  useEffect(() => {
    if (!showPointsModal) {
      setPointsRecords([]);
      setPointsPage(1);
    }
  }, [showPointsModal]);

  // 组件加载时刷新用户信息（确保积分是最新的）
  useEffect(() => {
    refreshUserInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dashboard">
      {/* 顶部导航 */}
      <header className="dashboard-header">
        <div className="header-brand">
          {siteConfig?.logo ? (
            <img src={siteConfig.logo} alt={siteConfig.displayName || siteConfig.siteName} className="brand-logo" />
          ) : (
            <span className="brand-icon">◆</span>
          )}
          <span className="brand-text">{siteConfig?.displayName || siteConfig?.siteName || '易企漫剧'}</span>
        </div>

        <div className="header-right">
          {/* 积分显示 */}
          <div className="credits-box" onClick={handleOpenPointsModal}>
            <span className="credits-value">{userCredits.toLocaleString()}</span>
            <span className="credits-unit">积分</span>
            <span className="credits-arrow">›</span>
          </div>

          {/* 充值按钮 */}
          <button className="recharge-btn" onClick={() => setShowRechargeModal(true)}>
            充值
          </button>

          {/* 用户信息 */}
          <div
            className="user-info"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="user-avatar">
              {displayUserName.charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{displayUserName}</span>

            {showUserMenu && (
              <div
                className="user-menu"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button onClick={handleAccountSettings} className="menu-item menu-item-neutral">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v6m0 6v6M1 12h6m6 0h6" />
                  </svg>
                  <span>个人设置</span>
                </button>
                <button onClick={handleLogout} className="menu-item menu-item-danger">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16,17 21,12 16,7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>退出登录</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="dashboard-main">
        <div className="welcome-text">
          <h1>欢迎回来，{displayUserName}</h1>
          <p>选择一个功能开始创作</p>
        </div>

        <div className="feature-grid">
          <div className="feature-card feature-primary" onClick={handleImageGenerator}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div className="feature-content">
              <h3>AI 图像生成</h3>
              <p>文生图 · 图生图</p>
            </div>
            <span className="feature-arrow">→</span>
          </div>

          <div className="feature-card feature-primary" onClick={handleVideoGenerator}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
            </div>
            <div className="feature-content">
              <h3>AI 视频生成</h3>
              <p>参考图 · 多角色</p>
            </div>
            <span className="feature-arrow">→</span>
          </div>

          <div className="feature-card" onClick={handleSoraWorkflow}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="feature-content">
              <h3>剧本工作流</h3>
              <p>项目管理</p>
            </div>
            <span className="feature-arrow">→</span>
          </div>

          <div className="feature-card" onClick={handleScriptManager}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 7h8" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <div className="feature-content">
              <h3>剧本管理</h3>
              <p>角色与场景</p>
            </div>
            <span className="feature-arrow">→</span>
          </div>

          <div className="feature-card" onClick={handleImageReverse}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
                <path d="M14 3v4h4" />
                <path d="M10 21v-4H6" />
              </svg>
            </div>
            <div className="feature-content">
              <h3>媒体反推</h3>
              <p>图片/视频生成提示词</p>
            </div>
            <span className="feature-arrow">→</span>
          </div>

          <div className="feature-card" onClick={handleStoryboardCut}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
                <path d="M15 9v12" />
                <path d="M3 15h18" />
              </svg>
            </div>
            <div className="feature-content">
              <h3>分镜处理</h3>
              <p>分割·替换·导出</p>
            </div>
            <span className="feature-arrow">→</span>
          </div>

          <div className="feature-card" onClick={handleCharacterProjects}>
            <div className="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="feature-content">
              <h3>角色项目</h3>
              <p>剧本→资源→分镜</p>
            </div>
            <span className="feature-arrow">→</span>
          </div>
        </div>
      </main>

      {/* 积分详情模态框 */}
      {showPointsModal && (
        <div className="modal-overlay" onClick={() => setShowPointsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>积分明细</h2>
              <button className="modal-close" onClick={() => setShowPointsModal(false)}>×</button>
            </div>

            <div className="points-summary">
              <span className="summary-label">当前积分</span>
              <span className="summary-value">{userCredits.toLocaleString()}</span>
            </div>

            <div className="modal-body">
              {pointsLoading ? (
                <div className="loading-state">加载中...</div>
              ) : pointsRecords.length === 0 ? (
                <div className="empty-state">暂无积分记录</div>
              ) : (
                <div className="records-list">
                  {pointsRecords.map((record) => (
                    <div key={record.id} className="record-item">
                      <div className="record-main">
                        <div className="record-left">
                          <span className="record-source">{record.source || '积分变动'}</span>
                          {record.remark && <span className="record-remark">{record.remark}</span>}
                          <span className="record-time">{formatDate(record.createdAt)}</span>
                        </div>
                        <div className="record-right">
                          <span className={`record-points ${record.type === 1 ? 'income' : 'expense'}`}>
                            {record.type === 1 ? '+' : '-'}{record.points}
                          </span>
                          <span className="record-balance">余额: {record.balance}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pointsTotal > 10 && (
              <div className="modal-footer">
                <button
                  className="page-btn"
                  disabled={pointsPage === 1}
                  onClick={() => fetchPointsRecords(pointsPage - 1)}
                >
                  上一页
                </button>
                <span className="page-info">第 {pointsPage} 页</span>
                <button
                  className="page-btn"
                  disabled={pointsPage * 10 >= pointsTotal}
                  onClick={() => fetchPointsRecords(pointsPage + 1)}
                >
                  下一页
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 卡密充值模态框 */}
      {showRechargeModal && (
        <div className="modal-overlay" onClick={() => setShowRechargeModal(false)}>
          <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>卡密充值</h2>
              <button className="modal-close" onClick={() => setShowRechargeModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="input-group">
                <label>请输入卡密</label>
                <input
                  type="text"
                  placeholder="输入卡密兑换码"
                  value={cardCode}
                  onChange={(e) => setCardCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRecharge()}
                />
              </div>

              <button
                className="submit-btn"
                onClick={handleRecharge}
                disabled={rechargeLoading || !cardCode.trim()}
              >
                {rechargeLoading ? '充值中...' : '立即充值'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
