package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
@Schema(description = "提取视频资源请求")
public class ExtractVideoResourceRequest {

    @NotBlank(message = "视频提示词不能为空")
    @Schema(description = "视频提示词")
    private String videoPrompt;

    @Schema(description = "视频资源列表")
    private List<VideoResourceItem> resources;

    @Data
    @Schema(description = "视频资源项")
    public static class VideoResourceItem {
        @Schema(description = "角色ID")
        private String characterId;

        @Schema(description = "资源名称")
        private String name;

        @Schema(description = "资源类型")
        private String type;

        @Schema(description = "视频URL")
        private String videoUrl;
    }
}
