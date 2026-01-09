package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 批量生成分镜视频请求
 */
@Data
@Schema(description = "批量生成分镜视频请求")
public class BatchGenerateStoryboardsRequest {

    @NotEmpty(message = "分镜ID列表不能为空")
    @Schema(description = "分镜ID列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Long> storyboardIds;
}
