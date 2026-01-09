package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 复制视频资源请求
 */
@Data
@Schema(description = "复制视频资源请求")
public class VideoResourceCopyRequest {

    @NotNull(message = "目标剧本ID不能为空")
    @Schema(description = "目标剧本ID", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long targetScriptId;

    @Schema(description = "新资源名称（可选，不填则保持原名）")
    private String newResourceName;
}
