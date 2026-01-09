package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 更新工作流项目请求
 */
@Data
@Schema(description = "更新工作流项目请求")
public class WorkflowProjectUpdateRequest {

    @Schema(description = "项目名称")
    private String name;

    @Schema(description = "项目描述")
    private String description;

    @Schema(description = "缩略图URL")
    private String thumbnail;

    @Schema(description = "关联的剧本ID（可选，传null可解除绑定）")
    private Long scriptId;

    @Schema(description = "工作流类型: character-resource(角色资源), storyboard(分镜图)")
    private String workflowType;

    @Schema(description = "项目风格: realistic, anime, cartoon, oil painting, watercolor, sketch, 3D render, cyberpunk, minimalist, vintage")
    private String style;

    @Schema(description = "工作流数据")
    private Object workflowData;
}
