package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 聊天消息对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "聊天消息")
public class ChatMessage {

    @Schema(description = "角色：user(用户)、assistant(助手)、system(系统)", example = "user")
    @NotBlank(message = "角色不能为空")
    private String role;

    @Schema(description = "消息内容", example = "你好")
    @NotBlank(message = "消息内容不能为空")
    private String content;
}
