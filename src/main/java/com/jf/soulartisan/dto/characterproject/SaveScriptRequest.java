package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 保存剧本请求
 */
@Data
@Schema(description = "保存剧��请求")
public class SaveScriptRequest {

    @NotBlank(message = "剧本内容不能为空")
    @Schema(description = "剧本内容", requiredMode = Schema.RequiredMode.REQUIRED)
    private String scriptContent;

    @Schema(description = "风格")
    private String style;
}
