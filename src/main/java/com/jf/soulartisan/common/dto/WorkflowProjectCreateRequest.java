package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建工作流项目请求
 */
@Data
@Schema(description = "创建工作流项目请求")
public class WorkflowProjectCreateRequest {

    @NotBlank(message = "项目名称不能为空")
    @Schema(description = "项目名称", required = true)
    private String name;

    @Schema(description = "项目描述")
    private String description;

    @Schema(description = "缩略图URL")
    private String thumbnail;

    @Schema(description = "关联的剧本ID（可选）")
    private Long scriptId;

    @Schema(description = "工作流类型: character-resource(角色资源), storyboard(分镜图)")
    private String workflowType;

    @Schema(description = "项目风格: realistic, anime, cartoon, oil painting, watercolor, sketch, 3D render, cyberpunk, minimalist, vintage")
    private String style;

    @NotNull(message = "工作流数据不能为空")
    @Schema(description = "工作流数据", required = true)
    private Object workflowData;
}
