package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 生成资源视频请求
 */
@Data
@Schema(description = "生成资源视频请求")
public class GenerateResourceRequest {

    @Schema(description = "角色参考图URL")
    private String characterImageUrl;

    @Schema(description = "提示词（如果不提供则使用资源已有的提示词）")
    private String prompt;
}
