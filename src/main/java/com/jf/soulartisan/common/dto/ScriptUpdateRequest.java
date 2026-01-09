package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 更新剧本请求
 */
@Data
@Schema(description = "更新剧本请求")
public class ScriptUpdateRequest {

    @Schema(description = "剧本名称")
    private String name;

    @Schema(description = "剧本描述")
    private String description;

    @Schema(description = "封面图URL")
    private String coverImage;

    @Schema(description = "状态: active-活跃, archived-归档")
    private String status;

    @Schema(description = "风格(使用GenerationStyle枚举值)")
    private String style;
}
