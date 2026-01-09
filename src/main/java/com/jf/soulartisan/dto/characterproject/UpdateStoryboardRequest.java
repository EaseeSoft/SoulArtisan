package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 更新分镜请求
 */
@Data
@Schema(description = "更新分镜请求")
public class UpdateStoryboardRequest {

    @Schema(description = "分镜名称")
    private String sceneName;

    @Schema(description = "分镜描述")
    private String sceneDescription;

    @Schema(description = "视频提示词")
    private String videoPrompt;
}
