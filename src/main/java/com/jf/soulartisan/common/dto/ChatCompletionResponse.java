package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 聊天完成响应
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "聊天完成响应")
public class ChatCompletionResponse {

    @Schema(description = "响应ID")
    private String id;

    @Schema(description = "对象类型")
    private String object;

    @Schema(description = "创建时间戳")
    private Long created;

    @Schema(description = "模型名称")
    private String model;

    @Schema(description = "选择列表")
    private List<Choice> choices;

    @Schema(description = "使用情况")
    private Usage usage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "选择项")
    public static class Choice {
        @Schema(description = "索引")
        private Integer index;

        @Schema(description = "消息")
        private ChatMessage message;

        @Schema(description = "结束原因")
        private String finishReason;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Schema(description = "Token 使用情况")
    public static class Usage {
        @Schema(description = "提示词 token 数")
        private Integer promptTokens;

        @Schema(description = "完成 token 数")
        private Integer completionTokens;

        @Schema(description = "总 token 数")
        private Integer totalTokens;
    }
}
