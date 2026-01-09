import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getScriptList,
  createScript,
  deleteScript,
  updateScript,
} from '@/api/script';
import type { Script } from '@/api/script';
import { showWarning, showSuccess } from '@/utils/request';
import { IMAGE_STYLES } from '@/constants/enums';
import './ScriptManager.css';

const ScriptManager: React.FC = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScriptName, setNewScriptName] = useState('');
  const [newScriptDesc, setNewScriptDesc] = useState('');
  const [newScriptStyle, setNewScriptStyle] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadScripts();
  }, [statusFilter]);

  const loadScripts = async () => {
    setLoading(true);
    try {
      const result = await getScriptList({
        page: 1,
        pageSize: 50,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        keyword: searchKeyword || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setScripts((result.data.list as Script[]) || []);
    } catch (error) {
      console.error('加载剧本列表失败:', error);
      showWarning('加载剧本列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScript = (scriptId: number) => {
    navigate(`/scripts/${scriptId}`);
  };

  const handleDeleteScript = async (scriptId: number, scriptName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除剧本 "${scriptName}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await deleteScript(scriptId);
      loadScripts();
      showSuccess('剧本删除成功');
    } catch (error) {
      console.error('删除剧本失败:', error);
      showWarning('删除剧本失败');
    }
  };

  const handleArchiveScript = async (script: Script, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = script.status === 'active' ? 'archived' : 'active';
    const actionText = newStatus === 'archived' ? '归档' : '恢复';

    try {
      await updateScript(script.id, { status: newStatus });
      loadScripts();
      showSuccess(`剧本${actionText}成功`);
    } catch (error) {
      console.error(`${actionText}剧本失败:`, error);
      showWarning(`${actionText}剧本失败`);
    }
  };

  const handleCreateScript = async () => {
    if (!newScriptName.trim()) {
      showWarning('请输入剧本名称');
      return;
    }

    setCreating(true);
    try {
      const result = await createScript({
        name: newScriptName.trim(),
        description: newScriptDesc.trim() || undefined,
        style: newScriptStyle || undefined,
      });
      setShowCreateModal(false);
      setNewScriptName('');
      setNewScriptDesc('');
      setNewScriptStyle('');
      loadScripts();
      showSuccess('剧本创建成功');
      // 跳转到新创建的剧本详情页
      if (result.data?.id) {
        navigate(`/scripts/${result.data.id}`);
      }
    } catch (error) {
      console.error('创建剧本失败:', error);
      showWarning('创建剧本失败');
    } finally {
      setCreating(false);
    }
  };

  const handleSearch = () => {
    loadScripts();
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="sm-page">
      {/* 顶部导航 */}
      <header className="sm-header">
        <button onClick={handleBackToDashboard} className="sm-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        <h1>剧本管理</h1>

        <div className="sm-header-actions">
          {/* 状态筛选 */}
          <div className="sm-filter">
            <button
              className={`sm-filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              全部
            </button>
            <button
              className={`sm-filter-btn ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              活跃
            </button>
            <button
              className={`sm-filter-btn ${statusFilter === 'archived' ? 'active' : ''}`}
              onClick={() => setStatusFilter('archived')}
            >
              已归档
            </button>
          </div>

          <div className="sm-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="搜索剧本..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button onClick={() => setShowCreateModal(true)} className="sm-create-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建剧本
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="sm-main">
        {loading ? (
          <div className="sm-loading">
            <div className="sm-spinner"></div>
            <span>加载中...</span>
          </div>
        ) : scripts.length === 0 ? (
          <div className="sm-empty">
            <div className="sm-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <path d="M8 7h8" />
                <path d="M8 11h6" />
              </svg>
            </div>
            <h2>暂无剧本</h2>
            <p>创建您的第一个剧本来管理角色和场景</p>
            <button onClick={() => setShowCreateModal(true)} className="sm-empty-btn">
              创建剧本
            </button>
          </div>
        ) : (
          <div className="sm-grid">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`sm-card ${script.status === 'archived' ? 'archived' : ''}`}
                onClick={() => handleOpenScript(script.id)}
              >
                <div className="sm-card-thumb">
                  {script.coverImage ? (
                    <img src={script.coverImage} alt={script.name} />
                  ) : (
                    <div className="sm-card-thumb-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                      </svg>
                    </div>
                  )}
                  {script.style && (
                    <div className="sm-card-style-badge">
                      {IMAGE_STYLES.find(s => s.value === script.style)?.label || script.style}
                    </div>
                  )}
                  {script.status === 'archived' && (
                    <div className="sm-card-archived-badge">已归档</div>
                  )}
                  {script.userRole === 'member' && (
                    <div className="sm-card-member-badge">我参与的</div>
                  )}
                </div>

                <div className="sm-card-body">
                  <h3>{script.name}</h3>
                  {script.description && (
                    <p className="sm-card-desc">{script.description}</p>
                  )}
                  <div className="sm-card-meta">
                    <span className="sm-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      {script.pictureResourceCount || 0} 图片
                    </span>
                    <span className="sm-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7" />
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                      </svg>
                      {script.videoResourceCount || 0} 视频
                    </span>
                    <span className="sm-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="M7 15h10M7 11h10M7 7h4" />
                      </svg>
                      {script.projectCount || 0} 项目
                    </span>
                    <span>{formatDate(script.updatedAt)}</span>
                  </div>
                </div>

                <div className="sm-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenScript(script.id)}
                    className="sm-action-btn primary"
                  >
                    查看
                  </button>
                  {script.userRole === 'creator' && (
                    <>
                      <button
                        onClick={(e) => handleArchiveScript(script, e)}
                        className="sm-action-btn"
                      >
                        {script.status === 'active' ? '归档' : '恢复'}
                      </button>
                      <button
                        onClick={(e) => handleDeleteScript(script.id, script.name, e)}
                        className="sm-action-btn danger"
                      >
                        删除
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 创建剧本模态框 */}
      {showCreateModal && (
        <div className="sm-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="sm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sm-modal-header">
              <h2>创建新剧本</h2>
              <button className="sm-modal-close" onClick={() => setShowCreateModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="sm-modal-body">
              <div className="sm-form-group">
                <label>剧本名称 *</label>
                <input
                  type="text"
                  placeholder="输入剧本名称"
                  value={newScriptName}
                  onChange={(e) => setNewScriptName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="sm-form-group">
                <label>剧本描述</label>
                <textarea
                  placeholder="输入剧本描述（可选）"
                  value={newScriptDesc}
                  onChange={(e) => setNewScriptDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="sm-form-group">
                <label>风格</label>
                <select
                  value={newScriptStyle}
                  onChange={(e) => setNewScriptStyle(e.target.value)}
                >
                  {IMAGE_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="sm-modal-footer">
              <button
                className="sm-modal-btn cancel"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button
                className="sm-modal-btn confirm"
                onClick={handleCreateScript}
                disabled={creating || !newScriptName.trim()}
              >
                {creating ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptManager;
