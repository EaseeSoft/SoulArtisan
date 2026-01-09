package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 文生图请求参数
 */
@Data
@Schema(description = "文生图请求参数")
public class TextToImageRequest {

    @NotBlank(message = "提示词不能为空")
    @Schema(description = "提示词", example = "一只可爱的猫咪", requiredMode = Schema.RequiredMode.REQUIRED)
    private String prompt;

    @Schema(description = "模型", example = "gemini-3-pro-image-preview", defaultValue = "gemini-3-pro-image-preview")
    private String model = "gemini-3-pro-image-preview";

    @Schema(description = "宽高比", example = "auto", defaultValue = "auto")
    private String aspectRatio = "auto";

    @Schema(description = "图片尺寸", example = "1K", defaultValue = "1K")
    private String imageSize = "1K";
}
