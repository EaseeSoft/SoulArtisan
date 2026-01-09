package com.jf.soulartisan.dto.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


/**
 * 创建图片角色资源请求
 */
@Data
public class CreateImageCharacterRequest {

    /**
     * 工作流项目ID
     */
    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    /**
     * 资源名称
     */
    @NotBlank(message = "资源名称不能为空")
    private String resourceName;

    /**
     * 图片URL
     */
    @NotBlank(message = "图片URL不能为空")
    private String imageUrl;

    /**
     * 图片格式
     */
    private String imageFormat;

    /**
     * 图片宽度
     */
    private Integer imageWidth;

    /**
     * 图片高度
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
