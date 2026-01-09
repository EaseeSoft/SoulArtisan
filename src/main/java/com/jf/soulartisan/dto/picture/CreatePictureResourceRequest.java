package com.jf.soulartisan.dto.picture;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建图片资源请求
 */
@Data
public class CreatePictureResourceRequest {

    /**
     * 项目ID（与剧本ID至少需要一个）
     */
    private Long projectId;

    /**
     * 剧本ID（与项目ID至少需要一个）
     */
    private Long scriptId;

    /**
     * 资源名称
     */
    @NotBlank(message = "资源名称不能为空")
    private String name;

    /**
     * 资源类型：character-角色, scene-场景, prop-道具, skill-技能
     */
    @NotBlank(message = "资源类型不能为空")
    private String type;

    /**
     * 图片URL
     */
    private String imageUrl;

    /**
     * 提示词
     */
    private String prompt;
}
