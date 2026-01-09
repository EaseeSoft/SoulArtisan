/**
 * 生成相关枚举配置
 * 根据API文档定义的参数选项
 */

// ==================== 图片生成相关 ====================

/**
 * 图片生成模型
 */
export const IMAGE_MODELS = [
  { value: 'default', label: '标准版' },
  { value: 'pro', label: '专业版' },
] as const;

/**
 * 图片宽高比
 */
export const IMAGE_ASPECT_RATIOS = [
  { value: 'auto', label: '自适应' },
  { value: '1:1', label: '1:1 (正方形)' },
  { value: '2:3', label: '2:3' },
  { value: '3:2', label: '3:2' },
  { value: '3:4', label: '3:4' },
  { value: '4:3', label: '4:3' },
  { value: '4:5', label: '4:5' },
  { value: '5:4', label: '5:4' },
  { value: '9:16', label: '9:16 (竖向)' },
  { value: '16:9', label: '16:9 (横向)' },
  { value: '21:9', label: '21:9 (超宽)' },
] as const;

/**
 * 图片分辨率
 */
export const IMAGE_SIZES = [
  { value: '1K', label: '1K (快速)' },
  { value: '2K', label: '2K (标准)' },
  { value: '4K', label: '4K (高质量)' },
] as const;

/**
 * 图片风格(用于拼接到提示词中)
 * 主要面向动漫、漫剧类创作
 * 注意：保持与后端 GenerationStyle.java 同步
 */
export const IMAGE_STYLES = [
  { value: '', label: '无特定风格', prompt: '' },

  // 日系动漫风格
  { value: 'japanese_anime', label: '日式动漫 (标准二次元)', prompt: 'Japanese anime style, standard 2D animation, clean lines, expressive characters' },
  { value: 'ghibli', label: '吉卜力风格 (宫崎骏手绘感)', prompt: 'Studio Ghibli style, Hayao Miyazaki hand-drawn aesthetic, soft colors, detailed backgrounds' },
  { value: 'shinkai', label: '新海诚风格 (高光感/唯美风景)', prompt: 'Makoto Shinkai style, high contrast lighting, beautiful scenery, photorealistic backgrounds' },
  { value: 'shonen', label: '热血少年漫 (火影/海贼王)', prompt: 'Shonen manga style, dynamic action poses, bold lines, intense expressions' },
  { value: 'shoujo', label: '少女漫画 (浪漫/梦幻)', prompt: 'Shoujo manga style, romantic, sparkly effects, delicate features, soft lighting' },
  { value: 'chibi', label: 'Q版萌系 (可爱头身比)', prompt: 'Chibi style, cute deformed proportions, big head, small body, kawaii aesthetic' },

  // 国漫与韩漫风格
  { value: 'manhua', label: '国漫风格 (中国网络漫画)', prompt: 'Chinese manhua style, modern comic art, vibrant colors, dynamic composition' },
  { value: 'manhwa', label: '韩漫风格 (韩国网漫)', prompt: 'Korean manhwa style, webtoon aesthetic, vertical scroll format, soft shading' },
  { value: 'chinese_ancient', label: '中国古风 (武侠/仙侠)', prompt: 'Chinese ancient style, wuxia, xianxia, traditional clothing, ink painting influence' },
  { value: 'ink_wash', label: '水墨风格 (传统国风动画)', prompt: 'Chinese ink wash painting style, traditional animation, flowing brushstrokes' },

  // 3D与特殊动画风格
  { value: '3d_anime', label: '3D动漫 (皮克斯/迪士尼)', prompt: '3D animated style, Pixar Disney style, smooth rendering, expressive characters' },
  { value: 'anime_realistic', label: '写实动漫 (半写实二次元)', prompt: 'Semi-realistic anime style, detailed features, realistic proportions with anime aesthetics' },

  // 场景氛围风格
  { value: 'cyberpunk', label: '赛博朋克 (霓虹/科幻)', prompt: 'Cyberpunk style, neon lights, high-tech, dark urban atmosphere, futuristic' },
  { value: 'fantasy', label: '奇幻风格 (魔法/异世界)', prompt: 'Fantasy style, magical atmosphere, mystical creatures, epic landscapes' },
] as const;

// ==================== 视频生成相关 ====================

/**
 * 视频生成模型
 */
export const VIDEO_MODELS = [
  { value: 'default', label: '标准版' },
  { value: 'pro', label: '专业版' },
] as const;

/**
 * 视频宽高比
 */
export const VIDEO_ASPECT_RATIOS = [
  { value: '16:9', label: '16:9 (横屏)' },
  { value: '9:16', label: '9:16 (竖屏)' },
] as const;

/**
 * 视频时长(秒)
 */
export const VIDEO_DURATIONS = [
  { value: 10, label: '10秒' },
  { value: 15, label: '15秒' },
  { value: 25, label: '25秒' },
] as const;

/**
 * 视频风格(与图片共用)
 */
export const VIDEO_STYLES = IMAGE_STYLES;

// ==================== 类型定义 ====================

export type ImageModel = typeof IMAGE_MODELS[number]['value'];
export type ImageAspectRatio = typeof IMAGE_ASPECT_RATIOS[number]['value'];
export type ImageSize = typeof IMAGE_SIZES[number]['value'];
export type ImageStyle = typeof IMAGE_STYLES[number]['value'];

export type VideoModel = typeof VIDEO_MODELS[number]['value'];
export type VideoAspectRatio = typeof VIDEO_ASPECT_RATIOS[number]['value'];
export type VideoDuration = typeof VIDEO_DURATIONS[number]['value'];
export type VideoStyle = typeof VIDEO_STYLES[number]['value'];
