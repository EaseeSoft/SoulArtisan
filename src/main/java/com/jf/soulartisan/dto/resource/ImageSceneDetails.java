package com.jf.soulartisan.dto.resource;

import lombok.Data;

import java.util.List;

/**
 * 图片场景资源详情
 * 对应 resourceType: image_scene
 * 用于存储分镜图工作流生成的场景九宫格图片
 */
@Data
public class ImageSceneDetails {
    /**
     * 图片URL
     */
    private String imageUrl;

    /**
     * 图片格式（如：png, jpg）
     */
    private String imageFormat;

    /**
     * 九宫格布局（如：3x3）
     */
    private String gridLayout;

    /**
     * 场景描述列表
     */
    private List<String> sceneDescriptions;

    /**
     * OSS存储路径
     */
    private String imageUrlOss;

    /**
     * 设计提示词
     */
    private String designPrompt;
}
