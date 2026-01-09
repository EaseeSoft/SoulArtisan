package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 多模态消息内容（支持文本、图片、视频）
 * 遵循 OpenAI 兼容格式
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "多模态消息内容")
public class MultimodalContent {

    @Schema(description = "内容类型：text(文本)、image_url(图片)、video_url(视频)", example = "text")
    private String type;

    @Schema(description = "文本内容（当 type=text 时使用）", example = "请分析这张图片")
    private String text;

    @Schema(description = "图片/视频 URL 配置（当 type=image_url 时使用）")
    private MediaUrl imageUrl;

    /**
     * 创建文本内容
     */
    public static MultimodalContent text(String text) {
        return MultimodalContent.builder()
                .type("text")
                .text(text)
                .build();
    }

    /**
     * 创建图片 URL 内容
     */
    public static MultimodalContent imageUrl(String url) {
        return MultimodalContent.builder()
                .type("image_url")
                .imageUrl(MediaUrl.builder().url(url).build())
                .build();
    }

    /**
     * 创建图片 URL 内容（带细节级别）
     */
    public static MultimodalContent imageUrl(String url, String detail) {
        return MultimodalContent.builder()
                .type("image_url")
                .imageUrl(MediaUrl.builder().url(url).detail(detail).build())
                .build();
    }

    /**
     * 媒体 URL 配置
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "媒体 URL 配置")
    public static class MediaUrl {
        @Schema(description = "媒体文件 URL", example = "https://example.com/image.jpg")
        private String url;

        @Schema(description = "细节级别：low, high, auto", example = "auto")
        private String detail;
    }
}
