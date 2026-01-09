package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 聊天完成请求
 */
@Data
@Schema(description = "聊天完成请求")
public class ChatCompletionRequest {

    @Schema(description = "模型名称", example = "gemini-3-pro-preview")
    @NotBlank(message = "模型不能为空")
    private String model = "gemini-3-pro-preview";

    @Schema(description = "消息列表")
    @NotEmpty(message = "消息列表不能为空")
    @Valid
    private List<ChatMessage> messages;

    @Schema(description = "聊天场景代码（可选，用于自动添加系统提示词）", example = "general")
    private String scenario;

    @Schema(description = "温度参数 (0-2)，控制随机性", example = "0.7")
    private Double temperature;

    @Schema(description = "top_p 参数 (0-1)，核采样", example = "1")
    private Double topP;

    @Schema(description = "生成的最大 token 数", example = "2048")
    private Integer maxTokens;

    @Schema(description = "是否流式输出", example = "false")
    private Boolean stream;

    @Schema(description = "停止序列")
    private String stop;

    @Schema(description = "存在惩罚 (-2.0 到 2.0)", example = "0")
    private Double presencePenalty;

    @Schema(description = "频率惩罚 (-2.0 到 2.0)", example = "0")
    private Double frequencyPenalty;
}
