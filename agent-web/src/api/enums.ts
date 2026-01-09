import request from '../utils/request';

/**
 * 枚举选项类型
 */
export interface EnumOption {
    value: string | number;
    label: string;
}

/**
 * 风格枚举选项类型(包含prompt)
 */
export interface StyleEnumOption extends EnumOption {
    prompt: string;
}

/**
 * 图片枚举
 */
export interface ImageEnums {
    models: EnumOption[];
    aspectRatios: EnumOption[];
    sizes: EnumOption[];
    styles: StyleEnumOption[];
}

/**
 * 视频枚举
 */
export interface VideoEnums {
    models: EnumOption[];
    aspectRatios: EnumOption[];
    durations: EnumOption[];
    styles: StyleEnumOption[];
}

/**
 * 角色枚举
 */
export interface CharacterEnums {
    aspectRatios: EnumOption[];
    durations: EnumOption[];
    styles: StyleEnumOption[];
}

/**
 * 所有枚举
 */
export interface AllEnums {
    imageModels: EnumOption[];
    imageAspectRatios: EnumOption[];
    imageSizes: EnumOption[];
    videoModels: EnumOption[];
    videoAspectRatios: EnumOption[];
    videoDurations: EnumOption[];
    styles: StyleEnumOption[];
}

/**
 * 获取所有枚举配置
 */
export const getAllEnums = async (): Promise<AllEnums> => {
    const response = await request<{ data: AllEnums }>({
        url: '/api/enums/all',
        method: 'GET',
    });
    return response.data.data;
};

/**
 * 获取图片相关枚举
 */
export const getImageEnums = async (): Promise<ImageEnums> => {
    const response = await request<{ data: ImageEnums }>({
        url: '/api/enums/image',
        method: 'GET',
    });
    return response.data.data;
};

/**
 * 获取视频相关枚举
 */
export const getVideoEnums = async (): Promise<VideoEnums> => {
    const response = await request<{ data: VideoEnums }>({
        url: '/api/enums/video',
        method: 'GET',
    });
    return response.data.data;
};

/**
 * 获取风格枚举
 */
export const getStyles = async (): Promise<EnumOption[]> => {
    const response = await request<{ data: EnumOption[] }>({
        url: '/api/enums/styles',
        method: 'GET',
    });
    return response.data.data;
};

/**
 * 获取角色相关枚举
 */
export const getCharacterEnums = async (): Promise<CharacterEnums> => {
    const response = await request<{ data: CharacterEnums }>({
        url: '/api/enums/character',
        method: 'GET',
    });
    return response.data.data;
};
