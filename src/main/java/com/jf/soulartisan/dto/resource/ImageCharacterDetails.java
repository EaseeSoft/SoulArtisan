package com.jf.soulartisan.dto.resource;

import lombok.Data;

/**
 * 图片角色资源详情
 * 对应 resourceType: image_character
 * 用于存储分镜图工作流生成的角色形象设计稿
 */
@Data
public class ImageCharacterDetails {
    /**
     * 图片URL
     */
    private String imageUrl;

    /**
     * 图片格式（如：png, jpg）
     */
    private String imageFormat;

    /**
     * 图片宽度（像素）
     */
    private Integer imageWidth;

    /**
     * 图片高度（像素）
     */
    private Integer imageHeight;

    /**
     * OSS存储路径
     */
    private String imageUrlOss;

    /**
     * 设计提示词
     */
    private String designPrompt;
}
