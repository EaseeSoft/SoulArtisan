import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjectList,
  createProject,
  deleteProject,
  type CharacterProject,
  type CreateProjectRequest,
} from '@/api/characterProject';
import { getSimpleScriptList } from '@/api/script';
import { showWarning, showSuccess } from '@/utils/request';
import { IMAGE_STYLES } from '@/constants/enums';
import './CharacterProjectList.css';

const CharacterProjectList: React.FC = () => {
  const [projects, setProjects] = useState<CharacterProject[]>([]);
  const [scripts, setScripts] = useState<Array<{ id: number; name: string; style?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // 表单状态
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    scriptId: undefined,
    style: '',
  });

  useEffect(() => {
    loadProjects();
    loadScripts();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const result = await getProjectList({
        page: 1,
        pageSize: 100,
      });
      setProjects(result.data.list || []);
    } catch (error) {
      console.error('加载项目列表失败:', error);
      showWarning('加载项目列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadScripts = async () => {
    try {
      const result = await getSimpleScriptList();
      setScripts(result.data || []);
    } catch (error) {
      console.error('加载剧本列表失败:', error);
    }
  };

  const handleOpenProject = (projectId: number) => {
    navigate(`/character-projects/${projectId}`);
  };

  const handleDeleteProject = async (projectId: number, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除项目 "${projectName}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      await deleteProject(projectId);
      loadProjects();
      showSuccess('项目删除成功');
    } catch (error) {
      console.error('删除项目失败:', error);
      showWarning('删除项目失败');
    }
  };

  const handleCreateProject = async () => {
    if (!formData.name.trim()) {
      showWarning('请输入项目名称');
      return;
    }

    setCreating(true);
    try {
      // 如果选择了剧本，从剧本获取风格
      let finalStyle = formData.style;
      if (formData.scriptId) {
        const script = scripts.find(s => s.id === formData.scriptId);
        if (script?.style) {
          finalStyle = script.style;
        }
      }

      const result = await createProject({
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        scriptId: formData.scriptId || undefined,
        style: finalStyle || undefined,
      });
      setShowCreateModal(false);
      resetForm();
      loadProjects();
      showSuccess('项目创建成功');
      // 跳转到新创建的项目详情页
      if (result.data?.id) {
        navigate(`/character-projects/${result.data.id}`);
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      showWarning('创建项目失败');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      scriptId: undefined,
      style: '',
    });
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '草稿';
      case 'in_progress':
        return '进行中';
      case 'completed':
        return '已完成';
      default:
        return status;
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    (project.description && project.description.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  return (
    <div className="cpl-page">
      {/* 顶部导航 */}
      <header className="cpl-header">
        <button onClick={handleBackToDashboard} className="cpl-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        <h1>角色项目</h1>

        <div className="cpl-header-actions">
          <div className="cpl-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="搜索项目..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
          </div>
          <button onClick={() => setShowCreateModal(true)} className="cpl-create-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建项目
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="cpl-main">
        {loading ? (
          <div className="cpl-loading">
            <div className="cpl-spinner"></div>
            <span>加载中...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="cpl-empty">
            <div className="cpl-empty-icon">📽️</div>
            <span>{searchKeyword ? '未找到匹配的项目' : '暂无项目，点击"新建项目"开始创作'}</span>
          </div>
        ) : (
          <div className="cpl-grid">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="cpl-card"
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="cpl-card-header">
                  <div>
                    <h3 className="cpl-card-title">{project.name}</h3>
                  </div>
                  <div className="cpl-card-actions">
                    <button
                      className="cpl-icon-btn delete"
                      onClick={(e) => handleDeleteProject(project.id, project.name, e)}
                      title="删除"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>

                <p className="cpl-card-desc">{project.description || '暂无描述'}</p>

                <div className="cpl-card-meta">
                  {project.scriptName && (
                    <div className="cpl-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                      </svg>
                      {project.scriptName}
                    </div>
                  )}
                  {project.style && (
                    <div className="cpl-meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      {IMAGE_STYLES.find(s => s.value === project.style)?.label || project.style}
                    </div>
                  )}
                  <div className="cpl-meta-item">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    {formatDate(project.updatedAt)}
                  </div>
                </div>

                <div className="cpl-card-footer">
                  <div className="cpl-progress-steps">
                    <div className={`cpl-step ${project.currentStep >= 1 ? 'active' : ''}`}>
                      1
                    </div>
                    <div className={`cpl-step ${project.currentStep >= 2 ? 'active' : ''}`}>
                      2
                    </div>
                    <div className={`cpl-step ${project.currentStep >= 3 ? 'active' : ''}`}>
                      3
                    </div>
                  </div>
                  <div className={`cpl-status-badge ${project.status}`}>
                    {getStatusText(project.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 创建项目模态框 */}
      {showCreateModal && (
        <div className="cpl-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="cpl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cpl-modal-header">
              <h2>新建角色项目</h2>
              <button className="cpl-modal-close" onClick={() => setShowCreateModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="cpl-form-group">
              <label>项目名称 *</label>
              <input
                type="text"
                placeholder="请输入项目名称"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="cpl-form-group">
              <label>项目描述</label>
              <textarea
                placeholder="请输入项目描述（可选）"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="cpl-form-group">
              <label>关联剧本（可选）</label>
              <select
                value={formData.scriptId || ''}
                onChange={(e) => setFormData({ ...formData, scriptId: e.target.value ? Number(e.target.value) : undefined })}
              >
                <option value="">不关联剧本</option>
                {scripts.map((script) => (
                  <option key={script.id} value={script.id}>
                    {script.name}
                  </option>
                ))}
              </select>
            </div>

            {!formData.scriptId && (
              <div className="cpl-form-group">
                <label>风格（可选）</label>
                <select
                  value={formData.style}
                  onChange={(e) => setFormData({ ...formData, style: e.target.value })}
                >
                  <option value="">请选择风格</option>
                  {IMAGE_STYLES.map((style) => (
                    <option key={style.value} value={style.value}>
                      {style.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="cpl-modal-actions">
              <button className="cpl-btn cpl-btn-cancel" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button
                className="cpl-btn cpl-btn-primary"
                onClick={handleCreateProject}
                disabled={creating}
              >
                {creating ? '创建中...' : '创建项目'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterProjectList;
