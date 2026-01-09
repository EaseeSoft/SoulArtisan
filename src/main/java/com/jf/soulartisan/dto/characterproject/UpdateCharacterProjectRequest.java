package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 更新角色项目请求
 */
@Data
@Schema(description = "更新角色项目请求")
public class UpdateCharacterProjectRequest {

    @Schema(description = "项目名称")
    private String name;

    @Schema(description = "项目描述")
    private String description;

    @Schema(description = "风格")
    private String style;

    @Schema(description = "剧本内容")
    private String scriptContent;

    @Schema(description = "当前步骤：1-输入剧本，2-提取资源，3-分镜创作")
    private Integer currentStep;

    @Schema(description = "项目状态：draft/in_progress/completed")
    private String status;
}
