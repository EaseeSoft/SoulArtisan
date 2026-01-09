package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建角色项目请求
 */
@Data
@Schema(description = "创建角色项目请求")
public class CreateCharacterProjectRequest {

    @NotBlank(message = "项目名称不能为空")
    @Schema(description = "项目名称", requiredMode = Schema.RequiredMode.REQUIRED)
    private String name;

    @Schema(description = "项目描述")
    private String description;

    @Schema(description = "关联剧本ID")
    private Long scriptId;

    @Schema(description = "风格（如果关联剧本，优先从剧本获取）")
    private String style;
}
