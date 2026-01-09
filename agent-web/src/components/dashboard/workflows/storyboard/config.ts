/**
 * 分镜图工作流配置
 * 用于创建和管理分镜、场景、视频
 */
import type { WorkflowConfig } from '../core/types';

// 导入通用节点
import ImageDisplayNode from '../../nodes/ImageDisplayNode';
import VideoDisplayNode from '../../nodes/VideoDisplayNode';
import RoleAnalysisNode from '../../nodes/RoleAnalysisNode';
import StoryDescriptionNode from '../../nodes/StoryDescriptionNode';

// 导入分镜专用节点
import SceneDescriptionNode from '../../nodes/SceneDescriptionNode';
import StoryboardNode from '../../nodes/StoryboardNode';
import StoryboardListNode from '../../nodes/StoryboardListNode';
import StoryboardImageNode from '../../nodes/StoryboardImageNode';
import StoryboardDisplayNode from '../../nodes/StoryboardDisplayNode';
import ResourcePromptNode from '../../nodes/ResourcePromptNode';

/**
 * 分镜图工作流配置
 */
export const storyboardConfig: WorkflowConfig = {
  id: 'storyboard',
  name: '分镜图',
  description: '分镜图流程工作流',
  icon: '🎬',

  features: {
    scriptBinding: true,      // 支持剧本绑定
    characterManagement: true, // 支持角色管理（用于分镜中引用角色）
    resourceLibrary: true,    // 支持资源库
    videoList: true,          // 支持视频列表
    undoRedo: true,           // 支持撤销/重做
  },

  nodes: [
    // ========== 通用节点 ==========
    {
      type: 'imageDisplayNode',
      label: '图片展示',
      source: 'shared',
      component: ImageDisplayNode,
      group: 'display',
      defaultData: {
        imageUrl: undefined,
        status: undefined,
      },
      inputs: [
        { id: 'image', name: '图片', type: 'image' },
      ],
      outputs: [
        { id: 'image', name: '图片', type: 'image' },
      ],
    },
    {
      type: 'videoDisplayNode',
      label: '视频展示',
      source: 'shared',
      component: VideoDisplayNode,
      group: 'display',
      defaultData: {
        videoUrl: undefined,
        status: undefined,
      },
      inputs: [
        { id: 'video', name: '视频', type: 'video' },
      ],
      outputs: [
        { id: 'video', name: '视频', type: 'video' },
      ],
    },
    {
      type: 'storyDescriptionNode',
      label: '剧情描述',
      source: 'shared',
      component: StoryDescriptionNode,
      group: 'input',
      defaultData: {
        content: '',
        generatedStoryboards: null,
      },
      outputs: [
        { id: 'storyboards', name: '分镜列表', type: 'json' },
      ],
    },
    {
      type: 'roleAnalysisNode',
      label: '小说输入',
      source: 'shared',
      component: RoleAnalysisNode,
      group: 'input',
      defaultData: {
        content: '',
        extractedRoles: null,
      },
      outputs: [
        { id: 'roles', name: '角色列表', type: 'json' },
      ],
    },

    // ========== 分镜专用节点 ==========
    {
      type: 'sceneDescriptionNode',
      label: '场景描述',
      source: 'workflow-specific',
      component: SceneDescriptionNode,
      group: 'input',
      defaultData: {
        content: '',
      },
      outputs: [
        { id: 'scene', name: '场景', type: 'scene' },
      ],
    },
    {
      type: 'storyboardSceneNode',
      label: '分镜',
      source: 'workflow-specific',
      component: StoryboardNode,
      group: 'storyboard',
      defaultData: {
        content: '',
        imagePrompt: '',
        videoPrompt: '',
        referenceImage: null,
        generatedImages: [],
        generatedVideos: [],
      },
      inputs: [
        { id: 'reference-input', name: '参考图', type: 'image' },
        { id: 'scene-input', name: '场景描述', type: 'scene' },
      ],
      outputs: [
        { id: 'image', name: '图片', type: 'image' },
        { id: 'video', name: '视频', type: 'video' },
      ],
    },
    {
      type: 'storyboardListNode',
      label: '分镜列表',
      source: 'workflow-specific',
      component: StoryboardListNode,
      group: 'storyboard',
      defaultData: {
        storyboards: [],
      },
      inputs: [
        { id: 'storyboards', name: '分镜数据', type: 'json' },
      ],
      outputs: [
        { id: 'storyboard', name: '分镜', type: 'json' },
      ],
    },
    {
      type: 'storyboardImageNode',
      label: '分镜图',
      source: 'workflow-specific',
      component: StoryboardImageNode,
      group: 'storyboard',
      defaultData: {
        imageUrl: '',
        imagePrompt: '',
        videoPrompt: '',
        status: 'idle',
      },
      inputs: [
        { id: 'reference-input-1', name: '参考图1', type: 'image' },
        { id: 'reference-input-2', name: '参考图2', type: 'image' },
        { id: 'reference-input-3', name: '参考图3', type: 'image' },
        { id: 'reference-input-4', name: '参考图4', type: 'image' },
        { id: 'reference-input-5', name: '参考图5', type: 'image' },
      ],
      outputs: [
        { id: 'image', name: '图片', type: 'image' },
        { id: 'video-prompt', name: '视频提示词', type: 'text' },
      ],
    },
    {
      type: 'storyboardDisplayNode',
      label: '分镜图展示',
      source: 'workflow-specific',
      component: StoryboardDisplayNode,
      group: 'display',
      defaultData: {
        imageUrl: undefined,
        status: undefined,
        imageStatus: undefined,
        prompt: '',
        videoPrompt: '',
        videoPromptLoading: false,
        aspectRatio: '16:9',
      },
      inputs: [
        { id: 'input', name: '输入', type: 'image' },
      ],
      outputs: [
        { id: 'output', name: '输出', type: 'image' },
      ],
    },
    {
      type: 'resourcePromptNode',
      label: '资源提示词',
      source: 'workflow-specific',
      component: ResourcePromptNode,
      group: 'input',
      defaultData: {
        prompt: '',
        style: '',
        size: '1:1',
        outputImage: null,
      },
      inputs: [
        { id: 'input', name: '输入', type: 'any' },
      ],
      outputs: [
        { id: 'output', name: '图片', type: 'image' },
      ],
    },
  ],

  toolbar: [
    { type: 'roleAnalysisNode', label: '小说输入', group: 'input' },
    { type: 'storyDescriptionNode', label: '剧情描述', group: 'input' },
    { type: 'sceneDescriptionNode', label: '场景描述', group: 'input', dividerAfter: true },
    { type: 'storyboardSceneNode', label: '分镜', group: 'storyboard' },
    { type: 'storyboardListNode', label: '分镜列表', group: 'storyboard' },
    { type: 'storyboardImageNode', label: '分镜图', group: 'storyboard' },
    { type: 'storyboardDisplayNode', label: '分镜图展示', group: 'display' },
  ],

  defaultViewport: { x: 0, y: 0, zoom: 0.8 },
};

export default storyboardConfig;
