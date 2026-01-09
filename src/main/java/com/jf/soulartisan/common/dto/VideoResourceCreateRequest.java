package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建视频资源请求
 */
@Data
@Schema(description = "创建视频资源请求")
public class VideoResourceCreateRequest {

    @NotNull(message = "项目ID不能为空")
    @Schema(description = "工作流项目ID", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long projectId;

    @Schema(description = "剧本ID")
    private Long scriptId;

    @NotBlank(message = "资源名称不能为空")
    @Schema(description = "资源名称", requiredMode = Schema.RequiredMode.REQUIRED)
    private String resourceName;

    @Schema(description = "资源类型: character-人物, scene-场景, prop-道具, skill-技能", example = "character")
    private String resourceType = "character";

    @Schema(description = "资源描述/提示词")
    private String prompt;

    @Schema(description = "资源图片URL（如果为空，状态为未生成）")
    private String imageUrl;
}
