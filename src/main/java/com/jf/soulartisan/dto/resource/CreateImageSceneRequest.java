package com.jf.soulartisan.dto.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 创建图片场景资源请求
 */
@Data
public class CreateImageSceneRequest {

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
     * 九宫格布局
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
