import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getScript,
  updateScript,
  getScriptProjects,
  getScriptMembers,
  addScriptMembers,
  removeScriptMember,
  searchUsers,
  type ScriptMember,
  type UserSearchResult,
} from '@/api/script';
import { getProjectList } from '@/api/workflowProject';
import {
  getScriptResources,
  deleteResource,
  createImageCharacter,
  createImageScene,
} from '@/api/scriptResource';
import {
  createPictureResource,
  batchCreatePictureResources,
  pagePictureResources,
  deletePictureResource,
  type PictureResourceType,
  type PictureResource,
  RESOURCE_TYPE_LABELS,
} from '@/api/pictureResource';
import {
  getScriptResources as getVideoScriptResources,
  batchCreateVideoResources,
  deleteVideoResource,
  type VideoResourceInfo,
} from '@/api/videoResource';
import {
  analysisAsset,
  analysisAssetVideo,
  type AssetItem,
} from '@/api/playbook';
import type { Script } from '@/api/script';
import type { ScriptResourceInfo, ResourceType } from '@/api/scriptResource';
import { showWarning, showSuccess, upload } from '@/utils/request';
import { IMAGE_STYLES } from '@/constants/enums';
import PictureResourceList from './PictureResourceList';
import VideoResourceTable from './VideoResourceTable';
import './ScriptDetail.css';

interface ProjectInfo {
  id: number;
  name: string;
  nodeCount: number;
  updatedAt: string;
}

const ScriptDetail: React.FC = () => {
  const { scriptId } = useParams<{ scriptId: string }>();
  const navigate = useNavigate();

  const [script, setScript] = useState<Script | null>(null);
  const [resources, setResources] = useState<ScriptResourceInfo[]>([]);
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [projectMap, setProjectMap] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'image-resources' | 'video-resources' | 'projects' | 'members'>('image-resources');

  // 成员相关状态
  const [members, setMembers] = useState<ScriptMember[]>([]);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberSearchKeyword, setMemberSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set());
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  // 图片资源状态
  const [pictureResources, setPictureResources] = useState<PictureResource[]>([]);

  // 视频资源状态
  const [videoResources, setVideoResources] = useState<VideoResourceInfo[]>([]);

  // 手动添加模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [addResourceCategory, setAddResourceCategory] = useState<PictureResourceType>('character');
  const [addResourceName, setAddResourceName] = useState('');
  const [addResourceUrl, setAddResourceUrl] = useState('');
  const [addResourceFormat, setAddResourceFormat] = useState('');
  const [addResourceWidth, setAddResourceWidth] = useState('');
  const [addResourceHeight, setAddResourceHeight] = useState('');
  const [addResourcePrompt, setAddResourcePrompt] = useState('');
  const [addingResource, setAddingResource] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 编辑状态
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editStyle, setEditStyle] = useState('');
  const [saving, setSaving] = useState(false);

  // 预览模态框
  const [previewResource, setPreviewResource] = useState<ScriptResourceInfo | null>(null);

  // 图片资源预览模态框
  const [previewPictureResource, setPreviewPictureResource] = useState<PictureResource | null>(null);

  // 自动识别模态框状态
  const [showAutoDetectModal, setShowAutoDetectModal] = useState(false);
  const [autoDetectContent, setAutoDetectContent] = useState('');
  const [extractingAssets, setExtractingAssets] = useState(false);
  const [extractedAssets, setExtractedAssets] = useState<(AssetItem & { id: string })[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [savingAssets, setSavingAssets] = useState(false);

  // 确认弹窗状态
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  // 显示确认弹窗
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  // 关闭确认弹窗
  const closeConfirm = () => {
    setConfirmModal({ show: false, title: '', message: '', onConfirm: () => {} });
  };

  // 执行确认操作
  const handleConfirm = () => {
    confirmModal.onConfirm();
    closeConfirm();
  };

  const loadScriptData = useCallback(async () => {
    if (!scriptId) return;

    setLoading(true);
    try {
      const [scriptData, resourcesData, projectsData, allProjectsData] = await Promise.all([
        getScript(Number(scriptId)),
        getScriptResources(Number(scriptId)),
        getScriptProjects(Number(scriptId)),
        getProjectList({ page: 1, pageSize: 100 }),
      ]);

      setScript(scriptData);
      setEditName(scriptData.name);
      setEditDesc(scriptData.description || '');
      setEditStyle(scriptData.style || '');

      // 处理资源数据
      const resourcesList = Array.isArray(resourcesData.data)
        ? resourcesData.data
        : (resourcesData.data as any).resources || [];
      setResources(resourcesList);

      // 处理项目数据
      const projectsList = (projectsData.data.projects as ProjectInfo[]) || [];
      setProjects(projectsList);

      // 处理所有项目数据（用于手动添加资源时选择项目）
      const allProjectsList = (allProjectsData.data?.list || allProjectsData.data?.projects || []) as ProjectInfo[];
      setAllProjects(allProjectsList);
      if (allProjectsList.length > 0) {
        setSelectedProjectId(allProjectsList[0].id);
      }

      // 创建项目ID到名称的映射
      const map = new Map<number, string>();
      projectsList.forEach(p => map.set(p.id, p.name));
      setProjectMap(map);
    } catch (error) {
      console.error('加载剧本数据失败:', error);
      showWarning('加载剧本数据失败');
    } finally {
      setLoading(false);
    }
  }, [scriptId]);

  // 加载图片资源
  const loadPictureResources = useCallback(async () => {
    if (!scriptId) return;

    try {
      const response = await pagePictureResources({
        scriptId: Number(scriptId),
        size: 100,
      });

      if (response.code === 200) {
        setPictureResources(response.data.records || []);
      }
    } catch (error) {
      console.error('加载图片资源失败:', error);
    }
  }, [scriptId]);

  // 加载视频资源
  const loadVideoResources = useCallback(async () => {
    if (!scriptId) return;

    try {
      const response = await getVideoScriptResources(Number(scriptId));

      if (response.code === 200) {
        setVideoResources(response.data.resources || []);
      }
    } catch (error) {
      console.error('加载视频资源失败:', error);
    }
  }, [scriptId]);

  // 加载成员列表（仅创建者可见）
  const loadMembers = useCallback(async () => {
    if (!scriptId || script?.userRole !== 'creator') return;

    try {
      const response = await getScriptMembers(Number(scriptId));
      if (response.code === 200) {
        setMembers(response.data.members || []);
      }
    } catch (error) {
      console.error('加载成员列表失败:', error);
    }
  }, [scriptId, script?.userRole]);

  // 搜索用户
  const handleSearchUsers = async () => {
    if (!memberSearchKeyword.trim()) {
      showWarning('请输入搜索关键词');
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await searchUsers(memberSearchKeyword.trim());
      if (response.code === 200) {
        // 过滤掉已经是成员的用户
        const existingUserIds = new Set(members.map(m => m.userId));
        const filteredResults = (response.data || []).filter(
          user => !existingUserIds.has(user.id)
        );
        setSearchResults(filteredResults);
        setSelectedUserIds(new Set());
      } else {
        showWarning(response.msg || '搜索失败');
      }
    } catch (error) {
      console.error('搜索用户失败:', error);
      showWarning('搜索用户失败');
    } finally {
      setSearchingUsers(false);
    }
  };

  // 切换选中用户
  const handleToggleUser = (userId: number) => {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // 批量添加成员
  const handleAddMembers = async () => {
    if (selectedUserIds.size === 0) {
      showWarning('请选择要添加的用户');
      return;
    }

    setAddingMembers(true);
    try {
      const response = await addScriptMembers(Number(scriptId), Array.from(selectedUserIds));
      if (response.code === 200) {
        showSuccess(`成功添加 ${response.data.addedCount} 名成员`);
        setShowAddMemberModal(false);
        setMemberSearchKeyword('');
        setSearchResults([]);
        setSelectedUserIds(new Set());
        loadMembers();
      } else {
        showWarning(response.msg || '添加失败');
      }
    } catch (error) {
      console.error('添加成员失败:', error);
      showWarning('添加成员失败');
    } finally {
      setAddingMembers(false);
    }
  };

  // 移除成员
  const handleRemoveMember = async (userId: number, username: string) => {
    showConfirm(
      '移除成员',
      `确定要移除成员 "${username}" 吗？`,
      async () => {
        try {
          const response = await removeScriptMember(Number(scriptId), userId);
          if (response.code === 200) {
            showSuccess('移除成功');
            loadMembers();
          } else {
            showWarning(response.msg || '移除失败');
          }
        } catch (error) {
          console.error('移除成员失败:', error);
          showWarning('移除成员失败');
        }
      }
    );
  };

  useEffect(() => {
    loadScriptData();
  }, [loadScriptData]);

  // 页面加载时同时获取图片资源和视频资源
  useEffect(() => {
    loadPictureResources();
    loadVideoResources();
  }, [loadPictureResources, loadVideoResources]);

  // 切换 tab 时刷新对应资源
  useEffect(() => {
    if (activeTab === 'image-resources') {
      loadPictureResources();
    } else if (activeTab === 'video-resources') {
      loadVideoResources();
    } else if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab]);

  const handleSaveEdit = async () => {
    if (!script || !editName.trim()) {
      showWarning('剧本名称不能为空');
      return;
    }

    setSaving(true);
    try {
      await updateScript(script.id, {
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        style: editStyle || undefined,
      });
      setScript({
        ...script,
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        style: editStyle || undefined,
      });
      setIsEditing(false);
      showSuccess('保存成功');
    } catch (error) {
      console.error('保存失败:', error);
      showWarning('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(script?.name || '');
    setEditDesc(script?.description || '');
    setEditStyle(script?.style || '');
    setIsEditing(false);
  };

  const handleDeleteResource = async (resource: ScriptResourceInfo) => {
    const typeText = resource.resourceCategory === 'character' ? '角色' : '场景';
    showConfirm(
      '删除确认',
      `确定要删除${typeText}资源 "${resource.resourceName}" 吗？此操作不可恢复。`,
      async () => {
        try {
          await deleteResource(resource.id);
          setResources(resources.filter((r) => r.id !== resource.id));
          showSuccess('删除成功');
        } catch (error) {
          console.error('删除资源失败:', error);
          showWarning('删除资源失败');
        }
      }
    );
  };

  // 删除图片资源
  const handleDeletePictureResource = async (resourceId: number, resourceName?: string) => {
    showConfirm(
      '删除确认',
      `确定要删除图片资源${resourceName ? ` "${resourceName}"` : ''} 吗？此操作不可恢复。`,
      async () => {
        try {
          await deletePictureResource(resourceId);
          setPictureResources(pictureResources.filter((r) => r.id !== resourceId));
          showSuccess('删除成功');
        } catch (error) {
          console.error('删除图片资源失败:', error);
          showWarning('删除图片资源失败');
        }
      }
    );
  };

  // 删除视频资源
  const handleDeleteVideoResource = async (resourceId: number, resourceName?: string) => {
    showConfirm(
      '删除确认',
      `确定要删除视频资源${resourceName ? ` "${resourceName}"` : ''} 吗？此操作不可恢复。`,
      async () => {
        try {
          await deleteVideoResource(resourceId);
          setVideoResources(videoResources.filter((r) => r.id !== resourceId));
          showSuccess('删除成功');
        } catch (error) {
          console.error('删除视频资源失败:', error);
          showWarning('删除视频资源失败');
        }
      }
    );
  };

  // 打开自动识别模态框
  const handleOpenAutoDetectModal = () => {
    setAutoDetectContent('');
    setExtractedAssets([]);
    setSelectedAssetIds(new Set());
    setShowAutoDetectModal(true);
  };

  // 提取资源
  const handleExtractAssets = async () => {
    if (!autoDetectContent.trim()) {
      showWarning('请输入剧本内容');
      return;
    }

    setExtractingAssets(true);
    try {
      // 根据当前 tab 调用不同的接口
      const result = activeTab === 'video-resources'
        ? await analysisAssetVideo(autoDetectContent)
        : await analysisAsset(autoDetectContent);

      if (result.code !== 200) {
        throw new Error(result.msg || '解析失败');
      }
      console.log('解析结果:', result.data);
      // 兼容两种返回格式：{ data: [...] } 或直接 { characters: [], scenes: [] }
      const responseData = result.data as any;
      const data = responseData.data ?? responseData;
      const assets: (AssetItem & { id: string })[] = [];

      // API返回的是数组格式，每个元素有 type, name, content 字段
      if (Array.isArray(data)) {
        // 按类型分组处理
        const typeCounters: Record<string, number> = {};
        data.forEach((item: { type: string; name: string; content: string }) => {
          const type = item.type as 'character' | 'scene' | 'prop' | 'skill';
          if (!typeCounters[type]) {
            typeCounters[type] = 0;
          }
          assets.push({
            id: `${type}_${typeCounters[type]++}`,
            name: item.name,
            type: type,
            prompt: item.content || '',
          });
        });
      } else {
        // 兼容旧的对象格式
        // 处理角色
        if (data.characters && Array.isArray(data.characters)) {
          data.characters.forEach((item: { name: string; prompt?: string; content?: string }, index: number) => {
            assets.push({
              id: `character_${index}`,
              name: item.name,
              type: 'character',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理场景
        if (data.scenes && Array.isArray(data.scenes)) {
          data.scenes.forEach((item: { name: string; prompt?: string; content?: string }, index: number) => {
            assets.push({
              id: `scene_${index}`,
              name: item.name,
              type: 'scene',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理道具
        if (data.props && Array.isArray(data.props)) {
          data.props.forEach((item: { name: string; prompt?: string; content?: string }, index: number) => {
            assets.push({
              id: `prop_${index}`,
              name: item.name,
              type: 'prop',
              prompt: item.prompt || item.content || '',
            });
          });
        }

        // 处理技能
        if (data.skills && Array.isArray(data.skills)) {
          data.skills.forEach((item: { name: string; prompt?: string; content?: string }, index: number) => {
            assets.push({
              id: `skill_${index}`,
              name: item.name,
              type: 'skill',
              prompt: item.prompt || item.content || '',
            });
          });
        }
      }

      if (assets.length === 0) {
        showWarning('未识别到任何资源');
      } else {
        setExtractedAssets(assets);
        // 默认全选
        setSelectedAssetIds(new Set(assets.map(a => a.id)));
        showSuccess(`成功识别 ${assets.length} 个资源`);
      }
    } catch (error) {
      console.error('提取资源失败:', error);
      showWarning('提取资源失败');
    } finally {
      setExtractingAssets(false);
    }
  };

  // 切换选中状态
  const handleToggleAsset = (assetId: string) => {
    setSelectedAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  // 全选/取消全选
  const handleSelectAllAssets = () => {
    if (selectedAssetIds.size === extractedAssets.length) {
      setSelectedAssetIds(new Set());
    } else {
      setSelectedAssetIds(new Set(extractedAssets.map(a => a.id)));
    }
  };

  // 保存选中的资源
  const handleSaveSelectedAssets = async () => {
    if (!script) {
      showWarning('剧本信息不存在');
      return;
    }

    if (selectedAssetIds.size === 0) {
      showWarning('请选择要保存的资源');
      return;
    }

    setSavingAssets(true);
    try {
      const selectedAssets = extractedAssets.filter(a => selectedAssetIds.has(a.id));

      if (activeTab === 'video-resources') {
        // 视频资源使用 batchCreateVideoResources API
        // 如果没有选择项目，使用第一个项目或不关联项目
        const result = await batchCreateVideoResources({
          projectId: selectedProjectId || (allProjects.length > 0 ? allProjects[0].id : 0),
          scriptId: script.id,
          resources: selectedAssets.map(asset => ({
            name: asset.name,
            type: asset.type as 'character' | 'scene' | 'prop' | 'skill',
            prompt: asset.prompt,
          })),
        });

        if (result.code === 200) {
          showSuccess(`成功保存 ${result.data.successCount} 个视频资源`);
          loadVideoResources();
          setShowAutoDetectModal(false);
        } else {
          showWarning(result.msg || '保存视频资源失败');
        }
      } else {
        // 图片资源使用 batchCreatePictureResources API
        const result = await batchCreatePictureResources({
          scriptId: script.id,
          resources: selectedAssets.map(asset => ({
            name: asset.name,
            type: asset.type as PictureResourceType,
            prompt: asset.prompt,
            imageUrl: '', // 初始没有图片，状态为未生成
          })),
        });

        if (result.code === 200) {
          showSuccess(`成功保存 ${result.data.successCount} 个图片资源`);
          loadPictureResources();
          setShowAutoDetectModal(false);
        } else {
          showWarning(result.msg || '保存资源失败');
        }
      }
    } catch (error) {
      console.error('保存资源失败:', error);
      showWarning('保存资源失败');
    } finally {
      setSavingAssets(false);
    }
  };

  const handlePreviewResource = (resource: ScriptResourceInfo) => {
    setPreviewResource(resource);
  };

  const handleOpenProject = (projectId: number) => {
    navigate(`/workflow?projectId=${projectId}`);
  };

  // 打开手动添加模态框
  const handleOpenAddModal = () => {
    setAddResourceCategory('character');
    setAddResourceName('');
    setAddResourceUrl('');
    setAddResourceFormat('');
    setAddResourceWidth('');
    setAddResourceHeight('');
    setAddResourcePrompt('');
    setImagePreviewUrl('');
    setShowAddModal(true);
  };

  // 处理图片上传
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showWarning('请上传图片文件 (jpg, png, gif, webp)');
      return;
    }

    // 验证文件大小 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showWarning('图片大小不能超过 10MB');
      return;
    }

    try {
      setUploadingImage(true);

      const response = await upload<{ code: number; data: { url: string } }>(
        '/api/file/upload',
        file
      );

      if (response.data.code === 200 && response.data.data?.url) {
        const imageUrl = response.data.data.url;
        setAddResourceUrl(imageUrl);
        setImagePreviewUrl(imageUrl);
        showSuccess('图片上传成功');
      } else {
        throw new Error('上传失败');
      }
    } catch (err) {
      console.error('图片上传失败:', err);
      showWarning(err instanceof Error ? err.message : '上传失败');
    } finally {
      setUploadingImage(false);
      // 清空 input，允许重复上传同一文件
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 移除已上传的图片
  const handleRemoveImage = () => {
    setAddResourceUrl('');
    setImagePreviewUrl('');
  };

  // 处理手动添加资源
  const handleAddResource = async () => {
    if (!script) {
      showWarning('剧本信息不存在');
      return;
    }

    if (!addResourceName.trim()) {
      showWarning('请输入资源名称');
      return;
    }

    if (!addResourceUrl.trim()) {
      showWarning('请输入图片URL');
      return;
    }

    setAddingResource(true);
    try {
      if (activeTab === 'image-resources') {
        // 调用新的图片资源 API
        await createPictureResource({
          scriptId: script.id,
          name: addResourceName.trim(),
          type: addResourceCategory,
          imageUrl: addResourceUrl.trim(),
          prompt: addResourcePrompt.trim() || undefined,
        });
      } else {
        // 视频资源仍然使用原有的 scriptResource API
        if (addResourceCategory === 'character') {
          await createImageCharacter({
            projectId: selectedProjectId!,
            resourceName: addResourceName.trim(),
            imageUrl: addResourceUrl.trim(),
            imageFormat: addResourceFormat.trim() || undefined,
            imageWidth: addResourceWidth ? parseInt(addResourceWidth) : undefined,
            imageHeight: addResourceHeight ? parseInt(addResourceHeight) : undefined,
            designPrompt: addResourcePrompt.trim() || undefined,
          });
        } else {
          await createImageScene({
            projectId: selectedProjectId!,
            resourceName: addResourceName.trim(),
            imageUrl: addResourceUrl.trim(),
            imageFormat: addResourceFormat.trim() || undefined,
            designPrompt: addResourcePrompt.trim() || undefined,
          });
        }
      }
      setShowAddModal(false);
      if (activeTab === 'image-resources') {
        loadPictureResources();
      } else {
        loadScriptData();
      }
      showSuccess('资源添加成功');
    } catch (error) {
      console.error('添加资源失败:', error);
      showWarning('添加资源失败');
    } finally {
      setAddingResource(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 统计图片和视频资源数量
  const imageResourceCount = pictureResources.length;
  const videoResourceCount = videoResources.length;

  if (loading) {
    return (
      <div className="sd-page">
        <div className="sd-loading">
          <div className="sd-spinner"></div>
          <span>加载中...</span>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="sd-page">
        <div className="sd-error">
          <p>剧本不存在或无权访问</p>
          <button onClick={() => navigate('/scripts')}>返回剧本列表</button>
        </div>
      </div>
    );
  }

  return (
    <div className="sd-page">
      {/* 顶部导航 */}
      <header className="sd-header">
        <button onClick={() => navigate('/scripts')} className="sd-back-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          返回
        </button>
        <h1>{script.name}</h1>
        <div className="sd-header-actions">
          {script.userRole === 'member' && (
            <span className="sd-readonly-badge">只读模式</span>
          )}
          {!isEditing && script.userRole === 'creator' && (
            <button onClick={() => setIsEditing(true)} className="sd-edit-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              编辑
            </button>
          )}
        </div>
      </header>

      {/* 剧本信息 */}
      <section className="sd-info">
        {isEditing ? (
          <div className="sd-edit-form">
            <div className="sd-form-group">
              <label>剧本名称</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="输入剧本名称"
              />
            </div>
            <div className="sd-form-group">
              <label>剧本描述</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="输入剧本描述（可选）"
                rows={3}
              />
            </div>
            <div className="sd-form-group">
              <label>风格</label>
              <select
                value={editStyle}
                onChange={(e) => setEditStyle(e.target.value)}
              >
                {IMAGE_STYLES.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="sd-edit-actions">
              <button onClick={handleCancelEdit} className="sd-btn cancel">
                取消
              </button>
              <button
                onClick={handleSaveEdit}
                className="sd-btn primary"
                disabled={saving || !editName.trim()}
              >
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : (
          <div className="sd-info-content">
            {script.description && <p className="sd-description">{script.description}</p>}
            <div className="sd-stats">
              <div className="sd-stat">
                <span className="sd-stat-value">{imageResourceCount}</span>
                <span className="sd-stat-label">图片资源</span>
              </div>
              <div className="sd-stat">
                <span className="sd-stat-value">{videoResourceCount}</span>
                <span className="sd-stat-label">视频资源</span>
              </div>
              <div className="sd-stat">
                <span className="sd-stat-value">{projects.length}</span>
                <span className="sd-stat-label">关联项目</span>
              </div>
              <div className="sd-stat">
                <span className="sd-stat-value">{formatDate(script.createdAt)}</span>
                <span className="sd-stat-label">创建时间</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 标签页 */}
      <div className="sd-tabs">
        <button
          className={`sd-tab ${activeTab === 'image-resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('image-resources')}
        >
          图片资源 ({imageResourceCount})
        </button>
        <button
          className={`sd-tab ${activeTab === 'video-resources' ? 'active' : ''}`}
          onClick={() => setActiveTab('video-resources')}
        >
          视频资源 ({videoResourceCount})
        </button>
        <button
          className={`sd-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          关联项目 ({projects.length})
        </button>
        {script.userRole === 'creator' && (
          <button
            className={`sd-tab ${activeTab === 'members' ? 'active' : ''}`}
            onClick={() => setActiveTab('members')}
          >
            剧本成员 ({members.length})
          </button>
        )}
      </div>

      {/* 内容区 */}
      <main className="sd-main">
        {activeTab === 'image-resources' ? (
          <>
            {/* 图片资源操作按钮栏（仅创建者可见） */}
            {script.userRole === 'creator' && (
              <div className="sd-action-bar">
                <button
                  className="sd-action-btn"
                  onClick={handleOpenAddModal}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  手动添加
                </button>
                <button
                  className="sd-action-btn sd-action-btn-auto"
                  onClick={handleOpenAutoDetectModal}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                  自动识别
                </button>
              </div>
            )}

            {/* 图片资源列表组件 */}
            <PictureResourceList
              resources={pictureResources}
              scriptStyle={script?.style}
              onResourcesChange={setPictureResources}
              onPreview={setPreviewPictureResource}
              onDelete={script.userRole === 'creator' ? handleDeletePictureResource : undefined}
              readOnly={script.userRole === 'member'}
            />
          </>
        ) : activeTab === 'video-resources' ? (
          <>
            {/* 视频资源操作按钮栏（仅创建者可见） */}
            {script.userRole === 'creator' && (
              <div className="sd-action-bar">
                <button
                  className="sd-action-btn sd-action-btn-auto"
                  onClick={handleOpenAutoDetectModal}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                  自动识别
                </button>
              </div>
            )}

            {/* 视频资源列表组件 */}
            <VideoResourceTable
              resources={videoResources}
              scriptStyle={script?.style}
              onResourcesChange={setVideoResources}
              onPreview={(resource) => {
                // 视频资源预览 - 可以预览视频或角色图片
                if (resource.videoUrl) {
                  setPreviewResource({
                    id: resource.id,
                    workflowProjectId: resource.projectId || 0,
                    resourceName: resource.resourceName,
                    resourceType: ('video_' + resource.resourceType) as ResourceType,
                    resourceCategory: resource.resourceType as 'character' | 'scene',
                    status: resource.status,
                    resourceDetails: {
                      videoUrl: resource.videoUrl,
                      imageUrl: resource.characterImageUrl,
                    },
                    createdAt: resource.createdAt,
                    updatedAt: resource.updatedAt,
                  } as ScriptResourceInfo);
                }
              }}
              onDelete={script.userRole === 'creator' ? handleDeleteVideoResource : undefined}
              readOnly={script.userRole === 'member'}
            />
          </>
        ) : activeTab === 'projects' ? (
          projects.length === 0 ? (
            <div className="sd-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h10M7 11h10M7 7h4" />
              </svg>
              <p>暂无关联项目</p>
              <span>在创建项目时选择此剧本即可关联</span>
            </div>
          ) : (
            <div className="sd-project-list">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="sd-project-item"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="sd-project-info">
                    <h3>{project.name}</h3>
                    <span className="sd-project-meta">
                      {project.nodeCount} 节点 · 更新于 {formatDate(project.updatedAt)}
                    </span>
                  </div>
                  <button className="sd-project-open">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'members' ? (
          <>
            {/* 成员操作栏 */}
            <div className="sd-action-bar">
              <button
                className="sd-action-btn"
                onClick={() => {
                  setMemberSearchKeyword('');
                  setSearchResults([]);
                  setSelectedUserIds(new Set());
                  setShowAddMemberModal(true);
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                添加成员
              </button>
            </div>

            {/* 成员列表 */}
            {members.length === 0 ? (
              <div className="sd-empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p>暂无成员</p>
                <span>点击"添加成员"邀请其他用户</span>
              </div>
            ) : (
              <div className="sd-member-list">
                {members.map((member) => (
                  <div key={member.id} className="sd-member-item">
                    <div className="sd-member-avatar">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.username} />
                      ) : (
                        <div className="sd-member-avatar-placeholder">
                          {(member.nickname || member.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="sd-member-info">
                      <div className="sd-member-name">
                        {member.nickname || member.username}
                        {member.role === 'creator' && (
                          <span className="sd-member-role-badge">创建者</span>
                        )}
                      </div>
                      <div className="sd-member-username">@{member.username}</div>
                    </div>
                    {member.role !== 'creator' && (
                      <button
                        className="sd-member-remove"
                        onClick={() => handleRemoveMember(member.userId, member.username)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </main>

      {/* 预览模态框 */}
      {previewResource && (
        <div className="rc-preview-modal" onClick={() => setPreviewResource(null)}>
          <div className="rc-preview-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="rc-preview-close"
              onClick={() => setPreviewResource(null)}
            >
              关闭
            </button>
            {previewResource.resourceType.startsWith('video_') ? (
              <video
                src={(previewResource.resourceDetails as any)?.videoUrl as string}
                controls
                autoPlay
              />
            ) : (
              <img src={(previewResource.resourceDetails as any)?.imageUrl as string} alt={previewResource.resourceName} />
            )}
          </div>
        </div>
      )}

      {/* 手动添加资源模态框 */}
      {showAddModal && (
        <div className="sd-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="sd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h2>手动添加{activeTab === 'image-resources' ? '图片' : '视频'}资源</h2>
              <button className="sd-modal-close" onClick={() => setShowAddModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="sd-modal-body">
              {/* 只有视频资源才需要选择项目 */}
              {activeTab === 'video-resources' && (
                <div className="sd-form-group">
                  <label>选择项目 *</label>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                  >
                    {allProjects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="sd-form-group">
                <label>资源类型 *</label>
                <select
                  value={addResourceCategory}
                  onChange={(e) => setAddResourceCategory(e.target.value as PictureResourceType)}
                >
                  <option value="character">角色</option>
                  <option value="scene">场景</option>
                  <option value="prop">道具</option>
                  <option value="skill">技能</option>
                </select>
              </div>
              <div className="sd-form-group">
                <label>资源名称 *</label>
                <input
                  type="text"
                  placeholder="输入资源名称"
                  value={addResourceName}
                  onChange={(e) => setAddResourceName(e.target.value)}
                />
              </div>
              <div className="sd-form-group">
                <label>图片上传 *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                {imagePreviewUrl ? (
                  <div className="sd-image-preview">
                    <img src={imagePreviewUrl} alt="预览" />
                    <button
                      type="button"
                      className="sd-remove-image"
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? '上传中...' : '移除'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="sd-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 4 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    {uploadingImage ? '上传中...' : '选择图片'}
                  </button>
                )}
              </div>
              {/* 只有视频资源才显示这些额外字段 */}
              {activeTab === 'video-resources' && (
                <>
                  <div className="sd-form-group">
                    <label>图片格式</label>
                    <input
                      type="text"
                      placeholder="例如: png, jpg"
                      value={addResourceFormat}
                      onChange={(e) => setAddResourceFormat(e.target.value)}
                    />
                  </div>
                  {addResourceCategory === 'character' && (
                    <>
                      <div className="sd-form-group">
                        <label>图片宽度</label>
                        <input
                          type="number"
                          placeholder="输入图片宽度"
                          value={addResourceWidth}
                          onChange={(e) => setAddResourceWidth(e.target.value)}
                        />
                      </div>
                      <div className="sd-form-group">
                        <label>图片高度</label>
                        <input
                          type="number"
                          placeholder="输入图片高度"
                          value={addResourceHeight}
                          onChange={(e) => setAddResourceHeight(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="sd-form-group">
                <label>提示词</label>
                <textarea
                  placeholder="输入提示词（可选）"
                  value={addResourcePrompt}
                  onChange={(e) => setAddResourcePrompt(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <div className="sd-modal-footer">
              <button
                className="sd-btn cancel"
                onClick={() => setShowAddModal(false)}
              >
                取消
              </button>
              <button
                className="sd-btn primary"
                onClick={handleAddResource}
                disabled={addingResource || !addResourceName.trim() || !addResourceUrl.trim()}
              >
                {addingResource ? '添加中...' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 自动识别模态框 */}
      {showAutoDetectModal && (
        <div className="sd-modal-overlay" onClick={() => setShowAutoDetectModal(false)}>
          <div className="sd-modal sd-modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h2>自动识别资源</h2>
              <button className="sd-modal-close" onClick={() => setShowAutoDetectModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="sd-modal-body">
              <div className="sd-form-group">
                <label>剧本内容 *</label>
                <textarea
                  className="sd-auto-detect-textarea"
                  placeholder="请粘贴剧本内容，AI 将自动识别其中的角色、场景、道具、技能等资源..."
                  value={autoDetectContent}
                  onChange={(e) => setAutoDetectContent(e.target.value)}
                  rows={8}
                />
              </div>
              <div className="sd-auto-detect-action">
                <button
                  className="sd-btn primary"
                  onClick={handleExtractAssets}
                  disabled={extractingAssets || !autoDetectContent.trim()}
                >
                  {extractingAssets ? (
                    <>
                      <span className="btn-spinner"></span>
                      正在识别...
                    </>
                  ) : (
                    '提取资源'
                  )}
                </button>
              </div>

              {/* 识别结果列表 */}
              {extractedAssets.length > 0 && (
                <div className="sd-extracted-assets">
                  <div className="sd-extracted-header">
                    <h3>识别结果 ({extractedAssets.length} 个资源)</h3>
                    <button
                      className="sd-select-all-btn"
                      onClick={handleSelectAllAssets}
                    >
                      {selectedAssetIds.size === extractedAssets.length ? '取消全选' : '全选'}
                    </button>
                  </div>

                  <div className="sd-extracted-list">
                    {extractedAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`sd-extracted-item ${selectedAssetIds.has(asset.id) ? 'selected' : ''}`}
                        onClick={() => handleToggleAsset(asset.id)}
                      >
                        <div className="sd-extracted-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedAssetIds.has(asset.id)}
                            onChange={() => handleToggleAsset(asset.id)}
                          />
                        </div>
                        <div className="sd-extracted-info">
                          <div className="sd-extracted-name">{asset.name}</div>
                          <div className="sd-extracted-meta">
                            <span className={`sd-extracted-type type-${asset.type}`}>
                              {RESOURCE_TYPE_LABELS[asset.type]}
                            </span>
                            {asset.prompt && (
                              <span className="sd-extracted-prompt" title={asset.prompt}>
                                {asset.prompt.length > 40 ? asset.prompt.slice(0, 40) + '...' : asset.prompt}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="sd-modal-footer">
              <button
                className="sd-btn cancel"
                onClick={() => setShowAutoDetectModal(false)}
              >
                取消
              </button>
              <button
                className="sd-btn primary"
                onClick={handleSaveSelectedAssets}
                disabled={savingAssets || selectedAssetIds.size === 0}
              >
                {savingAssets ? '保存中...' : `保存选中 (${selectedAssetIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认弹窗 */}
      {confirmModal.show && (
        <div className="sd-modal-overlay" onClick={closeConfirm}>
          <div className="sd-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sd-confirm-header">
              <h3>{confirmModal.title}</h3>
              <button className="sd-modal-close" onClick={closeConfirm}>×</button>
            </div>
            <div className="sd-confirm-body">
              <p>{confirmModal.message}</p>
            </div>
            <div className="sd-confirm-footer">
              <button className="sd-btn cancel" onClick={closeConfirm}>
                取消
              </button>
              <button className="sd-btn danger" onClick={handleConfirm}>
                确定删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 添加成员弹窗 */}
      {showAddMemberModal && (
        <div className="sd-modal-overlay" onClick={() => setShowAddMemberModal(false)}>
          <div className="sd-modal sd-modal-member" onClick={(e) => e.stopPropagation()}>
            <div className="sd-modal-header">
              <h2>添加成员</h2>
              <button className="sd-modal-close" onClick={() => setShowAddMemberModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="sd-modal-body">
              <div className="sd-member-search">
                <input
                  type="text"
                  placeholder="输入用户名或昵称搜索..."
                  value={memberSearchKeyword}
                  onChange={(e) => setMemberSearchKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                />
                <button
                  className="sd-search-btn"
                  onClick={handleSearchUsers}
                  disabled={searchingUsers}
                >
                  {searchingUsers ? '搜索中...' : '搜索'}
                </button>
              </div>

              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <div className="sd-search-results">
                  <div className="sd-search-results-header">
                    <span>搜索结果 ({searchResults.length})</span>
                    <span className="sd-selected-count">
                      已选择 {selectedUserIds.size} 人
                    </span>
                  </div>
                  <div className="sd-search-results-list">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className={`sd-search-result-item ${selectedUserIds.has(user.id) ? 'selected' : ''}`}
                        onClick={() => handleToggleUser(user.id)}
                      >
                        <div className="sd-result-checkbox">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.has(user.id)}
                            onChange={() => handleToggleUser(user.id)}
                          />
                        </div>
                        <div className="sd-result-avatar">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} />
                          ) : (
                            <div className="sd-avatar-placeholder">
                              {(user.nickname || user.username).charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="sd-result-info">
                          <div className="sd-result-name">
                            {user.nickname || user.username}
                          </div>
                          <div className="sd-result-username">@{user.username}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 空状态提示 */}
              {searchResults.length === 0 && memberSearchKeyword && !searchingUsers && (
                <div className="sd-search-empty">
                  <p>未找到匹配的用户</p>
                </div>
              )}
            </div>
            <div className="sd-modal-footer">
              <button
                className="sd-btn cancel"
                onClick={() => setShowAddMemberModal(false)}
              >
                取消
              </button>
              <button
                className="sd-btn primary"
                onClick={handleAddMembers}
                disabled={addingMembers || selectedUserIds.size === 0}
              >
                {addingMembers ? '添加中...' : `添加 (${selectedUserIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览弹框 */}
      {previewPictureResource && previewPictureResource.imageUrl && (
        <div className="sd-preview-overlay" onClick={() => setPreviewPictureResource(null)}>
          <div className="sd-preview-container" onClick={(e) => e.stopPropagation()}>
            <button className="sd-preview-close" onClick={() => setPreviewPictureResource(null)}>
              X
            </button>
            <img
              src={previewPictureResource.imageUrl}
              alt={previewPictureResource.name}
              className="sd-preview-image"
            />
            <div className="sd-preview-info">
              <h3>{previewPictureResource.name}</h3>
              <span className="sd-preview-type">
                {RESOURCE_TYPE_LABELS[previewPictureResource.type]}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptDetail;
