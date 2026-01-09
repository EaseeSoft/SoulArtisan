package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

/**
 * 图生图请求参数
 */
@Data
@Schema(description = "图生图请求参数")
public class ImageToImageRequest {

    @NotBlank(message = "提示词不能为空")
    @Schema(description = "提示词", example = "一只可爱的猫咪", requiredMode = Schema.RequiredMode.REQUIRED)
    private String prompt;

    @NotEmpty(message = "参考图不能为空")
    @Size(min = 1, max = 5, message = "参考图数量必须在1-5张之间")
    @Schema(description = "参考图URL列表（最多5张）", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<String> imageUrls;

    @Schema(description = "模型", example = "gemini-3-pro-image-preview", defaultValue = "gemini-3-pro-image-preview")
    private String model = "gemini-3-pro-image-preview";

    @Schema(description = "宽高比", example = "auto", defaultValue = "auto")
    private String aspectRatio = "auto";

    @Schema(description = "图片尺寸", example = "1K", defaultValue = "1K")
    private String imageSize = "1K";
}
