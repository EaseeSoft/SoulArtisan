import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import {
  updateUserInfo,
  updatePassword,
  uploadAvatar,
  getPointsRecords,
  PointsRecord,
} from '../../api/user';
import toast from 'react-hot-toast';
import './AccountSettingsPage.css';

const AccountSettingsPage: React.FC = () => {
  const { userInfo, refreshUserInfo } = useAuth();
  const { config: siteConfig } = useSiteConfig();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 基本信息
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');

  // 密码修改
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 加载状态
  const [updateLoading, setUpdateLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  // 积分相关（只读查看）
  const [pointsRecords, setPointsRecords] = useState<PointsRecord[]>([]);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointsPage, setPointsPage] = useState(1);
  const [pointsTotal, setPointsTotal] = useState(0);

  // 当前激活的标签
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'points'>('profile');

  // 初始化用户信息
  useEffect(() => {
    if (userInfo) {
      setNickname(userInfo.nickname || '');
      setEmail(userInfo.email || '');
      setPhone(userInfo.phone || '');
      setAvatar(userInfo.avatar || '');
    }
  }, [userInfo]);

  // 切换到积分标签时加载记录
  useEffect(() => {
    if (activeTab === 'points') {
      fetchPointsRecords(1);
    }
  }, [activeTab]);

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 更新基本信息
  const handleUpdateProfile = async () => {
    if (!nickname.trim()) {
      toast.error('请输入昵称');
      return;
    }

    setUpdateLoading(true);
    try {
      await updateUserInfo({
        nickname: nickname.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
      toast.success('更新成功');
      await refreshUserInfo();
    } catch (error) {
      toast.error('更新失败，请稍后重试');
    } finally {
      setUpdateLoading(false);
    }
  };

  // 上传头像
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小（2MB）
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    setAvatarLoading(true);
    try {
      const response = await uploadAvatar(file);
      toast.success('头像上传成功');
      setAvatar(response.data.avatar || '');
      await refreshUserInfo();
    } catch (error) {
      toast.error('上传失败，请稍后重试');
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 修改密码
  const handleUpdatePassword = async () => {
    if (!oldPassword) {
      toast.error('请输入原密码');
      return;
    }
    if (!newPassword) {
      toast.error('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('新密码至少6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致');
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword({
        oldPassword,
        newPassword,
      });
      toast.success('密码修改成功');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('密码修改失败，请检查原密码是否正确');
    } finally {
      setPasswordLoading(false);
    }
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

  // 跳转到首页进行充值
  const handleGoToRecharge = () => {
    navigate('/dashboard');
    // 延迟一点触发充值按钮，确保页面已加载
    setTimeout(() => {
      // 这里可以通过事件或状态来触发 Dashboard 的充值模态框
      // 暂时先跳转，用户可以手动点击充值按钮
    }, 100);
  };

  const displayUserName = userInfo?.nickname || userInfo?.username || '用户';
  const userCredits = userInfo?.points || 0;

  return (
    <div className="account-settings-page">
      {/* 顶部导航 */}
      <header className="settings-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/dashboard')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <h1>账户设置</h1>
          <div className="header-spacer"></div>
        </div>
      </header>

      <div className="settings-container">
        {/* 左侧导航 */}
        <aside className="settings-sidebar">
          <div className="sidebar-section">
            <h3>账户</h3>
            <nav>
              <button
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                个人信息
              </button>
              <button
                className={`nav-item ${activeTab === 'security' ? 'active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                安全设置
              </button>
              <button
                className={`nav-item ${activeTab === 'points' ? 'active' : ''}`}
                onClick={() => setActiveTab('points')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
                积分管理
              </button>
            </nav>
          </div>
        </aside>

        {/* 右侧内容 */}
        <main className="settings-main">
          {/* 个人信息 */}
          {activeTab === 'profile' && (
            <section className="settings-section">
              <div className="section-header">
                <h2>个人信息</h2>
                <p>管理您的基本信息和头像</p>
              </div>

              <div className="section-body">
                {/* 头像上传 */}
                <div className="avatar-section">
                  <div className="avatar-wrapper">
                    <div className="avatar-display">
                      {avatar ? (
                        <img src={avatar} alt="头像" />
                      ) : (
                        <span className="avatar-placeholder">
                          {displayUserName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      {avatarLoading && <div className="avatar-loading">上传中...</div>}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      style={{ display: 'none' }}
                    />
                    <button
                      className="avatar-upload-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarLoading}
                    >
                      更换头像
                    </button>
                  </div>
                  <p className="avatar-hint">支持 JPG、PNG 格式，文件大小不超过 2MB</p>
                </div>

                {/* 基本信息 */}
                <div className="form-group">
                  <label>用户名</label>
                  <input type="text" value={userInfo?.username || ''} disabled />
                  <p className="form-hint">用户名不可修改</p>
                </div>

                <div className="form-group">
                  <label>昵称</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="请输入昵称"
                  />
                </div>

                <div className="form-group">
                  <label>邮箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱"
                  />
                </div>

                <div className="form-group">
                  <label>手机号</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleUpdateProfile}
                    disabled={updateLoading}
                  >
                    {updateLoading ? '保存中...' : '保存修改'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 安全设置 */}
          {activeTab === 'security' && (
            <section className="settings-section">
              <div className="section-header">
                <h2>安全设置</h2>
                <p>修改您的登录密码</p>
              </div>

              <div className="section-body">
                <div className="form-group">
                  <label>原密码</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="请输入原密码"
                  />
                </div>

                <div className="form-group">
                  <label>新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="请输入新密码（至少6位）"
                  />
                </div>

                <div className="form-group">
                  <label>确认新密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入新密码"
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn-primary"
                    onClick={handleUpdatePassword}
                    disabled={passwordLoading}
                  >
                    {passwordLoading ? '修改中...' : '修改密码'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* 积分管理 - 只读查看 */}
          {activeTab === 'points' && (
            <section className="settings-section">
              <div className="section-header">
                <h2>积分管理</h2>
                <p>查看积分明细和账户余额</p>
              </div>

              <div className="section-body">
                {/* 积分汇总 */}
                <div className="points-overview">
                  <div className="overview-card">
                    <div className="overview-label">当前积分</div>
                    <div className="overview-value">{userCredits.toLocaleString()}</div>
                  </div>
                  <button className="btn-secondary" onClick={handleGoToRecharge}>
                    前往充值
                  </button>
                </div>

                <div className="recharge-hint">
                  点击"前往充值"跳转到首页进行卡密充值
                </div>

                {/* 积分记录 */}
                <div className="points-history">
                  <h3>消费明细</h3>
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
                              <span
                                className={`record-points ${record.type === 1 ? 'income' : 'expense'}`}
                              >
                                {record.type === 1 ? '+' : '-'}
                                {record.points}
                              </span>
                              <span className="record-balance">余额: {record.balance}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 分页 */}
                  {pointsTotal > 10 && (
                    <div className="pagination">
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
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default AccountSettingsPage;
