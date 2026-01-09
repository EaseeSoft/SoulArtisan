import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getProject,
  updateProject,
  saveScript,
  batchCreateResources,
  bindResources,
  getProjectResources,
  getAvailableResources,
  generateResourceVideo,
  deleteResource,
  batchCreateStoryboards,
  getStoryboards,
  generateStoryboardVideo,
  batchGenerateStoryboards,
  updateStoryboard,
  deleteStoryboard,
  type CharacterProject,
  type ProjectResource,
  type Storyboard,
} from '@/api/characterProject';
import { getTaskStatusByTaskId } from '@/api/videoGeneration';
import { updateVideoResource, getVideoResource } from '@/api/videoResource';
import { analysisAssetVideo, analysisCamera } from '@/api/playbook';
import { getSimpleScriptList } from '@/api/script';
import { showWarning, showSuccess, showInfo } from '@/utils/request';
import CharacterProjectResourceTable from './CharacterProjectResourceTable';
import './CharacterProjectDetail.css';

const CharacterProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // 项目信息
  const [project, setProject] = useState<CharacterProject | null>(null);
  const [loading, setLoading] = useState(true);

  // 步骤1：剧本编辑
  const [scriptContent, setScriptContent] = useState('');
  const [savingScript, setSavingScript] = useState(false);

  // 步骤2：资源管理
  const [resources, setResources] = useState<ProjectResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractScriptContent, setExtractScriptContent] = useState('');
  const [showBindModal, setShowBindModal] = useState(false);
  const [availableScripts, setAvailableScripts] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<number>();
  const [availableResources, setAvailableResources] = useState<Array<ProjectResource & { alreadyBound: boolean }>>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);

  // 步骤3：分镜管理
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [loadingStoryboards, setLoadingStoryboards] = useState(false);
  const [showExtractStoryboardModal, setShowExtractStoryboardModal] = useState(false);
  const [extractCount, setExtractCount] = useState(10);
  const [extractingStoryboards, setExtractingStoryboards] = useState(false);
  // 视频提示词编辑状态
  const [editingPromptId, setEditingPromptId] = useState<number | null>(null);
  const [editingPromptValue, setEditingPromptValue] = useState('');
  const [savingPrompt, setSavingPrompt] = useState(false);

  // 轮询定时器引用
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const characterPollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  useEffect(() => {
    if (project) {
      setScriptContent(project.scriptContent || '');

      if (project.currentStep >= 2) {
        loadResources();
      }
      if (project.currentStep >= 3) {
        loadStoryboards();
      }
    }
  }, [project]);

  // 轮询检查视频生成中的资源状态（单条查询）
  useEffect(() => {
    // 获取处于视频生成中状态且有videoTaskId的资源
    const generatingResources = resources.filter(
      (r) => r.status === 'video_generating' && r.videoTaskId
    );

    // 如果没有生成中的资源，清除定时器
    if (generatingResources.length === 0) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // 如果已经有定时器在运行，不要创建新的
    if (pollIntervalRef.current) {
      return;
    }

    // 设置定时器，每10秒查询一次视频任务状态
    pollIntervalRef.current = setInterval(async () => {
      // 获取当前需要轮询的资源
      const currentGenerating = resources.filter(
        (r) => r.status === 'video_generating' && r.videoTaskId
      );

      if (currentGenerating.length === 0) {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return;
      }

      // 逐个查询任务状态
      for (const resource of currentGenerating) {
        try {
          // videoTaskId 存储的是外部taskId，使用 by-task-id 接口查询
          const result = await getTaskStatusByTaskId(resource.videoTaskId!);
          if (result.code !== 200) {
            console.error('查询任务状态失败:', result.msg);
            continue;
          }

          const task = result.data;

          // 根据任务状态更新资源
          if (task.status === 'succeeded' && task.resultUrl) {
            // 更新数据库
            await updateVideoResource(resource.id, {
              videoUrl: task.resultUrl,
              videoResultUrl: task.resultUrl,
              status: 'video_generated',
            });

            // 更新本地状态
            setResources((prev) =>
              prev.map((r) =>
                r.id === resource.id
                  ? {
                      ...r,
                      videoUrl: task.resultUrl!,
                      videoResultUrl: task.resultUrl!,
                      status: 'video_generated' as const,
                    }
                  : r
              )
            );

            showSuccess(`资源 "${resource.resourceName}" 视频生成完成`);
          } else if (task.status === 'error') {
            // 更新数据库
            await updateVideoResource(resource.id, {
              status: 'failed',
              errorMessage: task.errorMessage || '视频生成失败',
            });

            // 更新本地状态
            setResources((prev) =>
              prev.map((r) =>
                r.id === resource.id
                  ? {
                      ...r,
                      status: 'failed' as const,
                      errorMessage: task.errorMessage || '视频生成失败',
                    }
                  : r
              )
            );

            showWarning(`资源 "${resource.resourceName}" 视频生成失败`);
          }
        } catch (error) {
          console.error('轮询任务状态失败:', error);
        }
      }
    }, 10000);

    // 清理函数
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [resources]);

  // 轮询检查角色生成中的资源状态（单条查询）
  useEffect(() => {
    // 获取处于角色生成中状态的资源
    const generatingResources = resources.filter(
      (r) => r.status === 'character_generating'
    );

    // 如果没有角色生成中的资源，清除定时器
    if (generatingResources.length === 0) {
      if (characterPollIntervalRef.current) {
        clearInterval(characterPollIntervalRef.current);
        characterPollIntervalRef.current = null;
      }
      return;
    }

    // 如果已经有定时器在运行，不要创建新的
    if (characterPollIntervalRef.current) {
      return;
    }

    // 设置定时器，每10秒查询一次角色生成状态
    characterPollIntervalRef.current = setInterval(async () => {
      // 获取当前需要轮询的资源
      const currentGenerating = resources.filter(
        (r) => r.status === 'character_generating'
      );

      if (currentGenerating.length === 0) {
        if (characterPollIntervalRef.current) {
          clearInterval(characterPollIntervalRef.current);
          characterPollIntervalRef.current = null;
        }
        return;
      }

      // 逐个查询资源状态（后端会主动刷新角色生成状态）
      for (const resource of currentGenerating) {
        try {
          const result = await getVideoResource(resource.id);
          if (result.code !== 200) {
            console.error('查询资源状态失败:', result.msg);
            continue;
          }

          const updatedResource = result.data;

          // 根据资源状态更新本地状态
          if (updatedResource.status === 'completed') {
            // 更新本地状态，只更新必要字段
            setResources((prev) =>
              prev.map((r) =>
                r.id === resource.id
                  ? {
                      ...r,
                      status: 'completed' as const,
                      characterId: updatedResource.characterId ?? undefined,
                      characterImageUrl: updatedResource.characterImageUrl ?? undefined,
                    }
                  : r
              )
            );

            showSuccess(`资源 "${resource.resourceName}" 角色生成完成`);
          } else if (updatedResource.status === 'failed') {
            // 更新本地状态，只更新必要字段
            setResources((prev) =>
              prev.map((r) =>
                r.id === resource.id
                  ? {
                      ...r,
                      status: 'failed' as const,
                      errorMessage: updatedResource.errorMessage ?? undefined,
                    }
                  : r
              )
            );

            showWarning(`资源 "${resource.resourceName}" 角色生成失败`);
          }
        } catch (error) {
          console.error('轮询角色生成状态失败:', error);
        }
      }
    }, 10000);

    // 清理函数
    return () => {
      if (characterPollIntervalRef.current) {
        clearInterval(characterPollIntervalRef.current);
        characterPollIntervalRef.current = null;
      }
    };
  }, [resources]);

  const loadProject = async () => {
    setLoading(true);
    try {
      const result = await getProject(Number(projectId));
      setProject(result.data);
    } catch (error) {
      console.error('加载项目失败:', error);
      showWarning('加载项目失败');
      navigate('/character-projects');
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    setLoadingResources(true);
    try {
      const result = await getProjectResources(Number(projectId));
      // 后端返回 { projectId, resources, total } 结构
      const data = result.data as any;
      setResources(Array.isArray(data) ? data : (data?.resources || []));
    } catch (error) {
      console.error('加载资源列表失败:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  const loadStoryboards = async () => {
    setLoadingStoryboards(true);
    try {
      const result = await getStoryboards(Number(projectId));
      // 后端返回 { projectId, storyboards, total } 结构
      const data = result.data as any;
      setStoryboards(Array.isArray(data) ? data : (data?.storyboards || []));
    } catch (error) {
      console.error('加载分镜列表失败:', error);
    } finally {
      setLoadingStoryboards(false);
    }
  };

  const handleBackToList = () => {
    navigate('/character-projects');
  };

  // ========== 步骤1：剧本管理 ==========

  const handleSaveScript = async () => {
    if (!scriptContent.trim()) {
      showWarning('请输入剧本内容');
      return;
    }

    setSavingScript(true);
    try {
      await saveScript(Number(projectId), {
        scriptContent: scriptContent.trim(),
      });

      // 更新项目步骤
      await updateProject(Number(projectId), { currentStep: 2 });
      await loadProject();
      showSuccess('剧本保存成功');
    } catch (error) {
      console.error('保存剧本失败:', error);
      showWarning('保存剧本失败');
    } finally {
      setSavingScript(false);
    }
  };

  // ========== 步骤2：资源管理 ==========

  const handleOpenExtractModal = () => {
    setExtractScriptContent(scriptContent);
    setShowExtractModal(true);
  };

  const handleExtractResources = async () => {
    if (!extractScriptContent.trim()) {
      showWarning('请输入要提取的剧本内容');
      return;
    }

    setExtracting(true);
    try {
      // 使用与剧本详情相同的视频资源解析接口
      const result = await analysisAssetVideo(extractScriptContent.trim());

      if (result.code !== 200) {
        throw new Error(result.msg || '解析失败');
      }

      console.log('解析结果:', result.data);

      // 兼容两种返回格式：{ data: [...] } 或直接 { characters: [], scenes: [] }
      const responseData = result.data as any;
      const data = responseData.data ?? responseData;

      interface ExtractedAsset {
        name: string;
        type: 'character' | 'scene' | 'prop' | 'skill';
        prompt: string;
      }

      const assets: ExtractedAsset[] = [];

      // API返回的是数组格式，每个元素有 type, name, content 字段
      if (Array.isArray(data)) {
        data.forEach((item: { type: string; name: string; content: string }) => {
          assets.push({
            name: item.name,
            type: item.type as 'character' | 'scene' | 'prop' | 'skill',
            prompt: item.content || '',
          });
        });
      } else {
        // 兼容旧的对象格式
        // 处理角色
        if (data.characters && Array.isArray(data.characters)) {
          data.characters.forEach((item: { name: string; prompt?: string; content?: string }) => {
            assets.push({
              name: item.name,
              type: 'character',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理场景
        if (data.scenes && Array.isArray(data.scenes)) {
          data.scenes.forEach((item: { name: string; prompt?: string; content?: string }) => {
            assets.push({
              name: item.name,
              type: 'scene',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理道具
        if (data.props && Array.isArray(data.props)) {
          data.props.forEach((item: { name: string; prompt?: string; content?: string }) => {
            assets.push({
              name: item.name,
              type: 'prop',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理技能
        if (data.skills && Array.isArray(data.skills)) {
          data.skills.forEach((item: { name: string; prompt?: string; content?: string }) => {
            assets.push({
              name: item.name,
              type: 'skill',
              prompt: item.prompt || item.content || '',
            });
          });
        }
      }

      if (assets.length === 0) {
        showWarning('未提取到资源');
        return;
      }

      // 批量创建资源
      const createResult = await batchCreateResources(Number(projectId), {
        resources: assets.map((r) => ({
          resourceName: r.name,
          resourceType: r.type,
          prompt: r.prompt,
        })),
      });

      setShowExtractModal(false);
      setExtractScriptContent('');
      await loadResources();
      // 后端返回可能也是对象结构
      const createdData = createResult.data as any;
      const createdCount = Array.isArray(createdData) ? createdData.length : (createdData?.length || assets.length);
      showSuccess(`成功提取并创建 ${createdCount} 个资源`);
    } catch (error) {
      console.error('提取资源失败:', error);
      showWarning('提取资源失败');
    } finally {
      setExtracting(false);
    }
  };

  const handleOpenBindModal = async () => {
    try {
      const scriptsResult = await getSimpleScriptList();
      setAvailableScripts(scriptsResult.data || []);
      setShowBindModal(true);
    } catch (error) {
      console.error('加载剧本列表失败:', error);
      showWarning('加载剧本列表失败');
    }
  };

  const handleScriptChange = async (scriptId: number) => {
    setSelectedScriptId(scriptId);
    setSelectedResourceIds([]);
    setAvailableResources([]);

    if (scriptId) {
      try {
        const result = await getAvailableResources(Number(projectId), scriptId);
        setAvailableResources(result.data.resources || []);
      } catch (error) {
        console.error('加载可选资源失败:', error);
        showWarning('加载可选资源失败');
      }
    }
  };

  const handleBindResources = async () => {
    if (!selectedScriptId) {
      showWarning('请选择剧本');
      return;
    }
    if (selectedResourceIds.length === 0) {
      showWarning('请至少选择一个资源');
      return;
    }

    try {
      await bindResources(Number(projectId), {
        scriptId: selectedScriptId,
        resourceIds: selectedResourceIds,
      });

      setShowBindModal(false);
      setSelectedScriptId(undefined);
      setSelectedResourceIds([]);
      setAvailableResources([]);
      await loadResources();
      showSuccess(`成功绑定 ${selectedResourceIds.length} 个资源`);
    } catch (error) {
      console.error('绑定资源失败:', error);
      showWarning('绑定资源失败');
    }
  };

  const handleGenerateResource = async (resourceId: number) => {
    try {
      showInfo('开始生成资源视频...');
      await generateResourceVideo(Number(projectId), resourceId, {});
      await loadResources();
      showSuccess('资源视频生成任务已提交');
    } catch (error) {
      console.error('生成资源视频失败:', error);
      showWarning('生成资源视频失败');
    }
  };

  const handleDeleteResource = async (resourceId: number, resourceName: string) => {
    if (!confirm(`确定要删除资源 "${resourceName}" 吗？`)) {
      return;
    }

    try {
      await deleteResource(Number(projectId), resourceId);
      await loadResources();
      showSuccess('资源删除成功');
    } catch (error) {
      console.error('删除资源失败:', error);
      showWarning('删除资源失败');
    }
  };

  const handleNextToStoryboard = async () => {
    if (resources.length === 0) {
      showWarning('请至少添加一个资源');
      return;
    }

    try {
      await updateProject(Number(projectId), { currentStep: 3 });
      await loadProject();
      showSuccess('进入分镜创作步骤');
    } catch (error) {
      console.error('更新步骤失败:', error);
      showWarning('更新步骤失败');
    }
  };

  // 返回到之前的步骤
  const handleGoToStep = async (step: number) => {
    try {
      await updateProject(Number(projectId), { currentStep: step });
      await loadProject();
    } catch (error) {
      console.error('返回步骤失败:', error);
      showWarning('返回步骤失败');
    }
  };

  // ========== 步骤3：分镜管理 ==========

  const handleOpenExtractStoryboardModal = () => {
    setShowExtractStoryboardModal(true);
  };

  const handleExtractStoryboards = async () => {
    if (extractCount < 1 || extractCount > 100) {
      showWarning('提取数量必须在 1-100 之间');
      return;
    }

    if (!project?.scriptContent) {
      showWarning('请先保存剧本内容');
      return;
    }

    setExtractingStoryboards(true);
    try {
      // 使用 playbook-analysis/camera 接口解析分镜
      // 返回格式: [{id, copywriting, prompt}, ...]
      const result = await analysisCamera({
        content: project.scriptContent,
        characterProjectId: Number(projectId),
        style: project.style,
        storyboardCount: extractCount,
      });

      if (result.code !== 200) {
        throw new Error(result.msg || '解析分镜失败');
      }

      // 新响应格式: 直接返回数组 [{id, copywriting, prompt}, ...]
      const storyboardData = Array.isArray(result.data) ? result.data : [];
      if (storyboardData.length === 0) {
        showWarning('未提取到分镜');
        return;
      }

      // 转换数据格式并批量创建分镜
      // id -> sceneNumber, copywriting -> sceneName, prompt -> sceneDescription
      await batchCreateStoryboards(Number(projectId), {
        storyboards: storyboardData.map((s: { id: number; copywriting: string; prompt: string }, index: number) => ({
          sceneNumber: s.id || (index + 1),
          sceneName: s.copywriting || `分镜 ${index + 1}`,
          sceneDescription: s.prompt || '',
          resources: [],
        })),
      });

      setShowExtractStoryboardModal(false);
      await loadStoryboards();
      showSuccess(`成功提取并创建 ${storyboardData.length} 个分镜`);
    } catch (error) {
      console.error('提取分镜失败:', error);
      showWarning('提取分镜失败');
    } finally {
      setExtractingStoryboards(false);
    }
  };

  const handleGenerateStoryboard = async (storyboardId: number) => {
    try {
      showInfo('开始生成分镜视频...');
      await generateStoryboardVideo(Number(projectId), storyboardId);
      await loadStoryboards();
      showSuccess('分镜视频生成任务已提交');
    } catch (error) {
      console.error('生成分镜视频失败:', error);
      showWarning('生成分镜视频失败');
    }
  };

  const handleBatchGenerateStoryboards = async () => {
    if (storyboards.length === 0) {
      showWarning('没有可生成的分镜');
      return;
    }

    if (!confirm(`确定要批量生成所有 ${storyboards.length} 个分镜的视频吗？`)) {
      return;
    }

    try {
      showInfo('开始批量生成分镜视频...');
      await batchGenerateStoryboards(Number(projectId), {
        storyboardIds: storyboards.map(s => s.id),
      });
      await loadStoryboards();
      showSuccess('分镜视频批量生成任务已提交');
    } catch (error) {
      console.error('批量生成分镜失败:', error);
      showWarning('批量生成分镜失败');
    }
  };

  const handleDeleteStoryboard = async (storyboardId: number, sceneName: string) => {
    if (!confirm(`确定要删除分镜 "${sceneName}" 吗？`)) {
      return;
    }

    try {
      await deleteStoryboard(Number(projectId), storyboardId);
      await loadStoryboards();
      showSuccess('分镜删除成功');
    } catch (error) {
      console.error('删除分镜失败:', error);
      showWarning('删除分镜失败');
    }
  };

  // 开始编辑视频提示词
  const handleStartEditPrompt = (storyboard: Storyboard) => {
    setEditingPromptId(storyboard.id);
    setEditingPromptValue(storyboard.videoPrompt || '');
  };

  // 取消编辑视频提示词
  const handleCancelEditPrompt = () => {
    setEditingPromptId(null);
    setEditingPromptValue('');
  };

  // 保存视频提示词
  const handleSaveVideoPrompt = async (storyboardId: number) => {
    setSavingPrompt(true);
    try {
      await updateStoryboard(Number(projectId), storyboardId, {
        videoPrompt: editingPromptValue,
      });
      await loadStoryboards();
      setEditingPromptId(null);
      setEditingPromptValue('');
      showSuccess('视频提示词保存成功');
    } catch (error) {
      console.error('保存视频提示词失败:', error);
      showWarning('保存视频提示词失败');
    } finally {
      setSavingPrompt(false);
    }
  };

  // ========== 渲染函数 ==========

  const getResourceTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      character: '角色',
      scene: '场景',
      prop: '道具',
      skill: '技能',
    };
    return typeMap[type] || type;
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      not_generated: '未生成',
      video_generating: '生成中',
      video_generated: '已生成',
      character_generating: '角色生成中',
      completed: '已完成',
      failed: '失败',
      pending: '待生成',
      generating: '生成中',
    };
    return statusMap[status] || status;
  };

  // 从分镜描述中解析 @characterId 并匹配资源
  const getMatchedResources = (sceneDescription?: string): ProjectResource[] => {
    if (!sceneDescription) return [];

    // 匹配 @xxx.xxx 或 @xxx 格式
    const regex = /@([\w.-]+)/g;
    const matches = sceneDescription.match(regex);
    if (!matches) return [];

    const matchedResources: ProjectResource[] = [];
    const characterIds = matches.map(m => m.substring(1)); // 去掉 @ 符号

    for (const charId of characterIds) {
      const resource = resources.find(r => r.characterId === charId);
      if (resource && !matchedResources.some(r => r.id === resource.id)) {
        matchedResources.push(resource);
      }
    }

    return matchedResources;
  };

  if (loading) {
    return (
      <div className="cpd-page">
        <div className="cpd-loading">
          <div className="cpd-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const currentStep = project.currentStep;

  return (
    <div className="cpd-page">
      {/* 顶部导航 */}
      <header className="cpd-header">
        <div className="cpd-header-left">
          <button onClick={handleBackToList} className="cpd-back-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            返回列表
          </button>
          <div className="cpd-title-wrapper">
            <h1 className="cpd-title">{project.name}</h1>
            {project.description && <p className="cpd-subtitle">{project.description}</p>}
          </div>
        </div>
      </header>

      {/* 进度步骤条 */}
      <div className="cpd-progress-bar">
        <div className="cpd-steps">
          <div
            className={`cpd-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed clickable' : ''}`}
            onClick={() => currentStep > 1 && handleGoToStep(1)}
          >
            <div className="cpd-step-circle">
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <div className="cpd-step-label">输入剧本</div>
          </div>
          <div
            className={`cpd-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed clickable' : ''}`}
            onClick={() => currentStep > 2 && handleGoToStep(2)}
          >
            <div className="cpd-step-circle">
              {currentStep > 2 ? '✓' : '2'}
            </div>
            <div className="cpd-step-label">提取资源</div>
          </div>
          <div className={`cpd-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="cpd-step-circle">3</div>
            <div className="cpd-step-label">分镜创作</div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="cpd-content">
        {/* 步骤1：输入剧本 */}
        {currentStep === 1 && (
          <div className="cpd-script-section">
            <div className="cpd-script-input">
              <label>剧本内容</label>
              <textarea
                placeholder="请输入剧本内容..."
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
              />
            </div>
            <div className="cpd-script-footer">
              <button
                className="cpd-btn cpd-btn-primary"
                onClick={handleSaveScript}
                disabled={savingScript || !scriptContent.trim()}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                {savingScript ? '保存中...' : '保存并继续'}
              </button>
            </div>
          </div>
        )}

        {/* 步骤2：提取资源 */}
        {currentStep === 2 && (
          <div className="cpd-resource-section">
            <div className="cpd-toolbar">
              <button className="cpd-btn-small cpd-btn-primary" onClick={handleOpenExtractModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                提取资源
              </button>
              <button className="cpd-btn-small cpd-btn-secondary" onClick={handleOpenBindModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                从剧本选择
              </button>
              <button
                className="cpd-btn-small cpd-btn-primary"
                onClick={handleNextToStoryboard}
                disabled={resources.length === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                下一步
              </button>
            </div>

            {loadingResources ? (
              <div className="cpd-loading">
                <div className="cpd-spinner"></div>
                <span>加载资源列表...</span>
              </div>
            ) : (
              <CharacterProjectResourceTable
                resources={resources}
                projectStyle={project?.style}
                onResourcesChange={setResources}
                onDelete={handleDeleteResource}
              />
            )}
          </div>
        )}

        {/* 步骤3：分镜创作 */}
        {currentStep === 3 && (
          <div className="cpd-storyboard-section">
            <div className="cpd-toolbar">
              <button className="cpd-btn-small cpd-btn-primary" onClick={handleOpenExtractStoryboardModal}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                提取分镜
              </button>
              <button
                className="cpd-btn-small cpd-btn-primary"
                onClick={handleBatchGenerateStoryboards}
                disabled={storyboards.length === 0}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                批量生成视频
              </button>
            </div>

            {loadingStoryboards ? (
              <div className="cpd-loading">
                <div className="cpd-spinner"></div>
                <span>加载分镜列表...</span>
              </div>
            ) : storyboards.length === 0 ? (
              <div className="cpd-empty">
                <div className="cpd-empty-icon">🎬</div>
                <p>暂无分镜，点击"提取分镜"开始创作</p>
              </div>
            ) : (
              storyboards.map((storyboard) => (
                <div key={storyboard.id} className="cpd-storyboard-card">
                  <div className="cpd-storyboard-header">
                    <div className="cpd-storyboard-info">
                      <div className="cpd-storyboard-number">
                        分镜 {storyboard.sceneNumber}
                      </div>
                      <h3 className="cpd-storyboard-name">{storyboard.sceneName || '未命名分镜'}</h3>
                      <p className="cpd-storyboard-desc">{storyboard.sceneDescription}</p>
                    </div>
                    <div className="cpd-actions">
                      <span className={`cpd-status-badge ${storyboard.status}`}>
                        {getStatusLabel(storyboard.status)}
                      </span>
                      {storyboard.status === 'pending' && (
                        <button
                          className="cpd-icon-btn"
                          onClick={() => handleGenerateStoryboard(storyboard.id)}
                          title="生成视频"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </button>
                      )}
                      {storyboard.videoUrl && (
                        <button className="cpd-icon-btn" title="预览视频">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                      )}
                      <button
                        className="cpd-icon-btn danger"
                        onClick={() => handleDeleteStoryboard(storyboard.id, storyboard.sceneName || '未命名分镜')}
                        title="删除"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  {/* 匹配的资源 */}
                  {(() => {
                    const matchedResources = getMatchedResources(storyboard.sceneDescription);
                    return matchedResources.length > 0 ? (
                      <div className="cpd-storyboard-resources">
                        <span className="cpd-storyboard-resources-label">引用资源:</span>
                        {matchedResources.map((resource) => (
                          <div key={resource.id} className="cpd-resource-tag">
                            {resource.characterImageUrl ? (
                              <img
                                src={resource.characterImageUrl}
                                alt={resource.resourceName}
                                className="cpd-resource-tag-img"
                              />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12.5 7a4 4 0 11-8 0 4 4 0 018 0z" />
                              </svg>
                            )}
                            {resource.resourceName}
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                  {/* 视频提示词编辑区 */}
                  <div className="cpd-storyboard-prompt">
                    <div className="cpd-storyboard-prompt-header">
                      <span className="cpd-storyboard-prompt-label">视频提示词:</span>
                      {editingPromptId !== storyboard.id && (
                        <button
                          className="cpd-btn-text"
                          onClick={() => handleStartEditPrompt(storyboard)}
                        >
                          编辑
                        </button>
                      )}
                    </div>
                    {editingPromptId === storyboard.id ? (
                      <div className="cpd-storyboard-prompt-edit">
                        <textarea
                          value={editingPromptValue}
                          onChange={(e) => setEditingPromptValue(e.target.value)}
                          placeholder="请输入视频提示词..."
                          rows={3}
                        />
                        <div className="cpd-storyboard-prompt-actions">
                          <button
                            className="cpd-btn-small cpd-btn-secondary"
                            onClick={handleCancelEditPrompt}
                            disabled={savingPrompt}
                          >
                            取消
                          </button>
                          <button
                            className="cpd-btn-small cpd-btn-primary"
                            onClick={() => handleSaveVideoPrompt(storyboard.id)}
                            disabled={savingPrompt}
                          >
                            {savingPrompt ? '保存中...' : '保存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="cpd-storyboard-prompt-text">
                        {storyboard.videoPrompt || '暂无视频提示词'}
                      </p>
                    )}
                  </div>
                  {/* 视频列表 */}
                  {storyboard.videos && storyboard.videos.length > 0 && (
                    <div className="cpd-storyboard-videos">
                      <div className="cpd-storyboard-videos-header">
                        <span className="cpd-storyboard-videos-label">生成的视频 ({storyboard.videos.length})</span>
                      </div>
                      <div className="cpd-storyboard-videos-grid">
                        {storyboard.videos.map((video) => (
                          <div key={video.id} className="cpd-storyboard-video-item">
                            {video.videoUrl ? (
                              <video
                                src={video.videoUrl}
                                controls
                                className="cpd-storyboard-video-player"
                              />
                            ) : (
                              <div className="cpd-storyboard-video-placeholder">
                                <span className={`cpd-status-badge ${video.status}`}>
                                  {getStatusLabel(video.status)}
                                </span>
                                {video.errorMessage && (
                                  <p className="cpd-storyboard-video-error">{video.errorMessage}</p>
                                )}
                              </div>
                            )}
                            <div className="cpd-storyboard-video-info">
                              <span className="cpd-storyboard-video-duration">
                                {video.duration}秒 · {video.aspectRatio || '16:9'}
                              </span>
                              <span className="cpd-storyboard-video-date">
                                {new Date(video.createdAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 提取资源模态框 */}
      {showExtractModal && (
        <div className="cpd-modal-overlay" onClick={() => setShowExtractModal(false)}>
          <div className="cpd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cpd-modal-header">
              <h2>提取资源</h2>
              <button className="cpd-modal-close" onClick={() => setShowExtractModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="cpd-modal-content">
              <div className="cpd-form-group">
                <label>剧本内容</label>
                <textarea
                  style={{ minHeight: '300px' }}
                  placeholder="请输入要提取资源的剧本内容..."
                  value={extractScriptContent}
                  onChange={(e) => setExtractScriptContent(e.target.value)}
                />
              </div>
            </div>
            <div className="cpd-modal-actions">
              <button className="cpd-btn cpd-btn-secondary" onClick={() => setShowExtractModal(false)}>
                取消
              </button>
              <button
                className="cpd-btn cpd-btn-primary"
                onClick={handleExtractResources}
                disabled={extracting || !extractScriptContent.trim()}
              >
                {extracting ? '提取中...' : '提取'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 绑定资源模态框 */}
      {showBindModal && (
        <div className="cpd-modal-overlay" onClick={() => setShowBindModal(false)}>
          <div className="cpd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cpd-modal-header">
              <h2>从剧本选择资源</h2>
              <button className="cpd-modal-close" onClick={() => setShowBindModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="cpd-modal-content">
              <div className="cpd-form-group">
                <label>选择剧本</label>
                <select
                  value={selectedScriptId || ''}
                  onChange={(e) => handleScriptChange(Number(e.target.value))}
                >
                  <option value="">请选择剧本</option>
                  {availableScripts.map((script) => (
                    <option key={script.id} value={script.id}>
                      {script.name}
                    </option>
                  ))}
                </select>
              </div>
              {availableResources.length > 0 && (
                <div className="cpd-form-group">
                  <label>选择资源</label>
                  <div className="cpd-checkbox-group">
                    {availableResources.map((resource) => (
                      <div key={resource.id} className="cpd-checkbox-item">
                        <input
                          type="checkbox"
                          id={`resource-${resource.id}`}
                          checked={selectedResourceIds.includes(resource.id)}
                          disabled={resource.alreadyBound}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResourceIds([...selectedResourceIds, resource.id]);
                            } else {
                              setSelectedResourceIds(selectedResourceIds.filter(id => id !== resource.id));
                            }
                          }}
                        />
                        <label htmlFor={`resource-${resource.id}`}>
                          {resource.resourceName} ({getResourceTypeLabel(resource.resourceType)})
                          {resource.alreadyBound && ' - 已绑定'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="cpd-modal-actions">
              <button className="cpd-btn cpd-btn-secondary" onClick={() => setShowBindModal(false)}>
                取消
              </button>
              <button
                className="cpd-btn cpd-btn-primary"
                onClick={handleBindResources}
                disabled={!selectedScriptId || selectedResourceIds.length === 0}
              >
                绑定选中资源
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 提取分镜模态框 */}
      {showExtractStoryboardModal && (
        <div className="cpd-modal-overlay" onClick={() => setShowExtractStoryboardModal(false)}>
          <div className="cpd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cpd-modal-header">
              <h2>提取分镜</h2>
              <button className="cpd-modal-close" onClick={() => setShowExtractStoryboardModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="cpd-modal-content">
              <div className="cpd-form-group">
                <label>提取数量</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="请输入要提取的分镜数量"
                  value={extractCount}
                  onChange={(e) => setExtractCount(Number(e.target.value))}
                />
              </div>
              <p style={{ fontSize: '14px', color: '#718096', marginTop: '10px' }}>
                系统将根据项目的剧本内容和已添加的资源，自动提取指定数量的分镜。
              </p>
            </div>
            <div className="cpd-modal-actions">
              <button className="cpd-btn cpd-btn-secondary" onClick={() => setShowExtractStoryboardModal(false)}>
                取消
              </button>
              <button
                className="cpd-btn cpd-btn-primary"
                onClick={handleExtractStoryboards}
                disabled={extractingStoryboards || extractCount < 1 || extractCount > 100}
              >
                {extractingStoryboards ? '提取中...' : '提取'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterProjectDetail;
