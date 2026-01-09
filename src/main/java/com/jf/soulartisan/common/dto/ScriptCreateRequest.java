package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 创建剧本请求
 */
@Data
@Schema(description = "创建剧本请求")
public class ScriptCreateRequest {

    @NotBlank(message = "剧本名称不能为空")
    @Schema(description = "剧本名称", required = true)
    private String name;

    @Schema(description = "剧本描述")
    private String description;

    @Schema(description = "封面图URL")
    private String coverImage;

    @Schema(description = "风格(使用GenerationStyle枚举值)")
    private String style;
}
