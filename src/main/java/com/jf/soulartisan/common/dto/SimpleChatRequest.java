package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 简化的聊天请求参数
 * 只需传入 content，后端自动构建 messages
 */
@Data
@Schema(description = "简化的聊天请求参数")
public class SimpleChatRequest {

    @NotBlank(message = "内容不能为空")
    @Schema(description = "用户消息内容", example = "帮我优化一个视频生成提示词", requiredMode = Schema.RequiredMode.REQUIRED)
    private String content;

    @Schema(description = "模型名称", example = "gemini-2.5-pro", defaultValue = "gemini-2.5-pro")
    private String model = "gemini-3-pro-preview";

    @Schema(description = "聊天场景代码（可选，用于自动添加系统提示词）", example = "video_assistant")
    private String scenario;

    @Schema(description = "温度参数 (0-2)，控制随机性", example = "0.7")
    private Double temperature;

    @Schema(description = "top_p 参数 (0-1)，核采样", example = "1")
    private Double topP;

    @Schema(description = "生成的最大 token 数", example = "2048")
    private Integer maxTokens;

    @Schema(description = "存在惩罚 (-2.0 到 2.0)", example = "0")
    private Double presencePenalty;

    @Schema(description = "频率惩罚 (-2.0 到 2.0)", example = "0")
    private Double frequencyPenalty;
}
