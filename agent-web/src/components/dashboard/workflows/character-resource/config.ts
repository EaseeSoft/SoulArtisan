/**
 * 角色资源工作流配置
 * 用于创建和管理角色、图片、视频资源
 */
import type { WorkflowConfig } from '../core/types';

// 导入通用节点
import ImageDisplayNode from '../../nodes/ImageDisplayNode';
import VideoDisplayNode from '../../nodes/VideoDisplayNode';
import RoleAnalysisNode from '../../nodes/RoleAnalysisNode';

// 导入角色资源专用节点
import ImageGenerationNode from '../../nodes/ImageGenerationNode';
import VideoGenerationNode from '../../nodes/VideoGenerationNode';
import CharacterGenerationNode from '../../nodes/CharacterGenerationNode';
import CharacterVideoNode from '../../nodes/CharacterVideoNode';
import CharacterDisplayNode from '../../nodes/CharacterDisplayNode';
import ResourcePromptNode from '../../nodes/ResourcePromptNode';
import StoryDescriptionNode from '../../nodes/StoryDescriptionNode';
import StoryboardNode from '../../nodes/StoryboardNode';
import StoryboardListNode from '../../nodes/StoryboardListNode';

/**
 * 角色资源工作流配置
 */
export const characterResourceConfig: WorkflowConfig = {
  id: 'character-resource',
  name: '角色流程',
  description: '角色流程工作流',
  icon: '👤',

  features: {
    scriptBinding: true,      // 支持剧本绑定
    characterManagement: true, // 支持角色管理
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

    // ========== 角色资源专用节点 ==========
    {
      type: 'roleAnalysisNode',
      label: '小说输入',
      source: 'workflow-specific',
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
    {
      type: 'imageGenerationNode',
      label: '文生图',
      source: 'workflow-specific',
      component: ImageGenerationNode,
      group: 'generation',
      defaultData: {
        referenceImage: null,
        prompt: '',
        style: '无',
        size: '1:1',
        outputImage: null,
      },
      inputs: [
        { id: 'prompt', name: '提示词', type: 'text' },
        { id: 'reference', name: '参考图', type: 'image', multiple: true },
      ],
      outputs: [
        { id: 'image', name: '图片', type: 'image' },
      ],
    },
    {
      type: 'videoGenerationNode',
      label: '文生视频',
      source: 'workflow-specific',
      component: VideoGenerationNode,
      group: 'generation',
      defaultData: {
        prompt: '',
        duration: 5,
        aspectRatio: '16:9',
        outputVideo: null,
      },
      inputs: [
        { id: 'prompt', name: '提示词', type: 'text' },
        { id: 'image', name: '参考图', type: 'image' },
      ],
      outputs: [
        { id: 'video', name: '视频', type: 'video' },
      ],
    },
    {
      type: 'characterGenerationNode',
      label: '角色生成',
      source: 'workflow-specific',
      component: CharacterGenerationNode,
      group: 'character',
      defaultData: {
        prompt: '',
        duration: 10,
        style: '',
        referenceImage: '',
        outputCharacter: null,
      },
      inputs: [
        { id: 'prompt', name: '提示词', type: 'text' },
      ],
      outputs: [
        { id: 'character', name: '角色', type: 'character' },
      ],
    },
    {
      type: 'characterVideoNode',
      label: '角色视频',
      source: 'workflow-specific',
      component: CharacterVideoNode,
      group: 'character',
      defaultData: {
        videoUrl: '',
        characterName: '',
        characterType: 'character',
      },
      inputs: [
        { id: 'video', name: '视频', type: 'video' },
      ],
      outputs: [
        { id: 'character', name: '角色', type: 'character' },
      ],
    },
    {
      type: 'characterDisplayNode',
      label: '角色展示',
      source: 'workflow-specific',
      component: CharacterDisplayNode,
      group: 'display',
      defaultData: {
        characterId: null,
        characterName: '',
        characterImage: '',
      },
      inputs: [
        { id: 'character', name: '角色', type: 'character' },
      ],
      outputs: [
        { id: 'character', name: '角色', type: 'character' },
      ],
    },
    {
      type: 'resourcePromptNode',
      label: '资源提示词',
      source: 'workflow-specific',
      component: ResourcePromptNode,
      group: 'input',
      defaultData: {
        resourceId: null,
        prompt: '',
      },
      inputs: [
        { id: 'resource', name: '资源', type: 'character' },
      ],
      outputs: [
        { id: 'prompt', name: '提示词', type: 'text' },
        { id: 'image', name: '图片', type: 'image' },
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
      type: 'storyboardSceneNode',
      label: '分镜',
      source: 'shared',
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
      source: 'shared',
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
  ],

  toolbar: [
    { type: 'roleAnalysisNode', label: '小说输入', group: 'input' },
    { type: 'storyDescriptionNode', label: '剧情描述', group: 'input' },
    { type: 'characterGenerationNode', label: '角色生成', group: 'character', dividerAfter: true },
    { type: 'imageGenerationNode', label: '文生图', group: 'generation' },
    { type: 'videoGenerationNode', label: '文生视频', group: 'generation', dividerAfter: true },
    { type: 'resourcePromptNode', label: '资源提示词', group: 'input' },
  ],

  defaultViewport: { x: 0, y: 0, zoom: 0.8 },
};

export default characterResourceConfig;
