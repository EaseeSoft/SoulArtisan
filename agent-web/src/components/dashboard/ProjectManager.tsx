import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProjectList,
  deleteProject,
  duplicateProject,
  createProject,
} from '@/api/workflowProject';
import type { WorkflowProject } from '@/api/workflowProject';
import { getSimpleScriptList } from '@/api/script';
import { showWarning, showSuccess } from '@/utils/request';
import { IMAGE_STYLES } from '@/constants/enums';
import './ProjectManager.css';

const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<WorkflowProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [selectedScriptId, setSelectedScriptId] = useState<number | undefined>(undefined);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [filterScriptId, setFilterScriptId] = useState<number | undefined>(undefined);
  const [scriptList, setScriptList] = useState<Array<{ id: number; name: string; style?: string }>>([]);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadScriptList();
    loadProjects();
  }, []);

  const loadScriptList = async () => {
    try {
      const result = await getSimpleScriptList();
      setScriptList(result.data || []);
    } catch (error) {
      console.error('加载剧本列表失败:', error);
    }
  };

  const loadProjects = async (scriptIdFilter?: number) => {
    setLoading(true);
    try {
      const result = await getProjectList({
        page: 1,
        pageSize: 50,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
        keyword: searchKeyword || undefined,
        scriptId: scriptIdFilter,
      });
      setProjects((result.data.list as WorkflowProject[]) || []);
    } catch (error) {
      console.error('加载项目列表失败:', error);
      showWarning('加载项目��表��败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenProject = (projectId: number) => {
    // 统一跳转到工作流编辑器
    navigate(`/workflow?projectId=${projectId}`);
  };

  const handleDeleteProject = async (projectId: number, projectName: string) => {
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

  const handleDuplicateProject = async (projectId: number) => {
    try {
      await duplicateProject(projectId);
      loadProjects();
      showSuccess('项目复制成功');
    } catch (error) {
      console.error('复制项目失败:', error);
      showWarning('复制项目失败');
    }
  };

  const handleCreateNew = async () => {
    setNewProjectName('');
    setNewProjectDesc('');
    setSelectedScriptId(undefined);
    setSelectedStyle('');
    setShowCreateModal(true);

    // 如果剧本列表为空，重新加载
    if (scriptList.length === 0) {
      setLoadingScripts(true);
      try {
        const result = await getSimpleScriptList();
        setScriptList(result.data || []);
      } catch (error) {
        console.error('加载剧本列表失败:', error);
      } finally {
        setLoadingScripts(false);
      }
    }
  };

  const handleConfirmCreate = async () => {
    if (!newProjectName.trim()) {
      showWarning('请输入项目名称');
      return;
    }

    setCreating(true);
    try {
      const result = await createProject({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
        scriptId: selectedScriptId,
        style: selectedStyle || undefined,
        workflowData: {
          nodes: [],
          edges: [],
          nodeOutputs: {},
        },
      });
      setShowCreateModal(false);
      showSuccess('项目创建成功');
      // 跳转到新创建的项目
      const projectId = (result.data as { id: number }).id;
      navigate(`/workflow?projectId=${projectId}`);
    } catch (error) {
      console.error('创建项目失败:', error);
      showWarning('创建项目失败');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelCreate = () => {
    setShowCreateModal(false);
    setNewProjectName('');
    setNewProjectDesc('');
    setSelectedScriptId(undefined);
    setSelectedStyle('');
  };

  const handleSearch = () => {
    loadProjects(filterScriptId);
  };

  const handleFilterByScript = (scriptId: number | undefined) => {
    setFilterScriptId(scriptId);
    loadProjects(scriptId);
  };

  // 处理选择剧本 - 自动应用剧本风格
  const handleSelectScript = (scriptId: number | undefined) => {
    setSelectedScriptId(scriptId);
    if (scriptId) {
      const selectedScript = scriptList.find(s => s.id === scriptId);
      if (selectedScript?.style) {
        setSelectedStyle(selectedScript.style);
      }
    }
  };

  // 获取当前选中剧本的风格
  const getSelectedScriptStyle = () => {
    if (selectedScriptId) {
      const selectedScript = scriptList.find(s => s.id === selectedScriptId);
      return selectedScript?.style;
    }
    return undefined;
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
    <div className="pm-page">
      {/* 顶部导航 */}
      <header className="pm-header">
        <button onClick={handleBackToDashboard} className="pm-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>

        <h1>工作流项目</h1>

        <div className="pm-header-actions">
          <div className="pm-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="搜索项目..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <select
            className="pm-filter-select"
            value={filterScriptId ?? ''}
            onChange={(e) => handleFilterByScript(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">全部剧本</option>
            {scriptList.map((script) => (
              <option key={script.id} value={script.id}>
                {script.name}
              </option>
            ))}
          </select>
          <button onClick={handleCreateNew} className="pm-create-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="pm-main">
        {loading ? (
          <div className="pm-loading">
            <div className="pm-spinner"></div>
            <span>加载中...</span>
          </div>
        ) : projects.length === 0 ? (
          <div className="pm-empty">
            <div className="pm-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
              </svg>
            </div>
            <h2>暂无项目</h2>
            <p>创建您的第一个工作流项目开始创作</p>
            <button onClick={handleCreateNew} className="pm-empty-btn">
              创建项目
            </button>
          </div>
        ) : (
          <div className="pm-grid">
            {projects.map((project) => (
              <div
                key={project.id}
                className="pm-card"
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="pm-card-thumb">
                  {project.thumbnail ? (
                    <img src={project.thumbnail} alt={project.name} />
                  ) : (
                    <div className="pm-card-thumb-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <polygon points="10,8 16,12 10,16" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                  {/* 标签区域 */}
                  <div className="pm-card-badges">
                    {project.scriptName && (
                      <span className="pm-card-script-badge">
                        📜 {project.scriptName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pm-card-body">
                  <h3>{project.name}</h3>
                  {project.description && (
                    <p className="pm-card-desc">{project.description}</p>
                  )}
                  <div className="pm-card-meta">
                    <span>{project.nodeCount} 节点</span>
                    <span>{formatDate(project.updatedAt)}</span>
                  </div>
                </div>

                <div className="pm-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleOpenProject(project.id)}
                    className="pm-action-btn primary"
                  >
                    打开
                  </button>
                  <button
                    onClick={() => handleDuplicateProject(project.id)}
                    className="pm-action-btn"
                  >
                    复制
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id, project.name)}
                    className="pm-action-btn danger"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 新建项目弹框 */}
      {showCreateModal && (
        <div className="pm-modal-overlay" onClick={handleCancelCreate}>
          <div className="pm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pm-modal-header">
              <h2>新建项目</h2>
              <button className="pm-modal-close" onClick={handleCancelCreate}>
                x
              </button>
            </div>
            <div className="pm-modal-body">
              <div className="pm-form-group">
                <label>项目名称 <span className="pm-required">*</span></label>
                <input
                  type="text"
                  placeholder="请输入项目名称"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="pm-form-group">
                <label>项目描述</label>
                <textarea
                  placeholder="请输入项目描述（可选）"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="pm-form-group">
                <label>绑定剧本</label>
                <select
                  value={selectedScriptId ?? ''}
                  onChange={(e) => handleSelectScript(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={loadingScripts}
                >
                  <option value="">不绑定剧本</option>
                  {loadingScripts ? (
                    <option disabled>加载中...</option>
                  ) : (
                    scriptList.map((script) => (
                      <option key={script.id} value={script.id}>
                        {script.name}{script.style ? ` (${IMAGE_STYLES.find(s => s.value === script.style)?.label || script.style})` : ''}
                      </option>
                    ))
                  )}
                </select>
              </div>
              {getSelectedScriptStyle() ? (
                <div className="pm-form-group">
                  <label>项目风格</label>
                  <div className="pm-script-style-hint">
                    使用剧本风格：{IMAGE_STYLES.find(s => s.value === getSelectedScriptStyle())?.label || getSelectedScriptStyle()}
                  </div>
                </div>
              ) : (
                <div className="pm-form-group">
                  <label>项目风格</label>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                  >
                    {IMAGE_STYLES.map((style) => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="pm-modal-footer">
              <button className="pm-modal-btn cancel" onClick={handleCancelCreate}>
                取消
              </button>
              <button
                className="pm-modal-btn confirm"
                onClick={handleConfirmCreate}
                disabled={creating}
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

export default ProjectManager;
