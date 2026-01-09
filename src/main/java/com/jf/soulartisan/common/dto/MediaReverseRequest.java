package com.jf.soulartisan.common.dto;

import com.jf.soulartisan.common.enums.GeminiModel;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 媒体反推请求（图片/视频反推提示词）
 */
@Data
@Schema(description = "媒体反推请求")
public class MediaReverseRequest {

    @Schema(description = "媒体文件 URL（图片或视频的公网可访问地址）", example = "https://example.com/image.jpg", required = true)
    @NotBlank(message = "媒体 URL 不能为空")
    private String mediaUrl;

    @Schema(description = "附加的文本说明（可选）", example = "请详细分析这个内容")
    private String text;

    @Schema(description = "使用的模型", example = "gemini-2.5-pro")
    private String model = GeminiModel.GEMINI_3_PRO_PREVIEW.getValue();
}
