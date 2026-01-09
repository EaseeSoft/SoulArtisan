package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 用户信息更新请求参数
 */
@Data
@Schema(description = "用户信息更新请求参数")
public class UserUpdateRequest {

    @Size(max = 50, message = "昵称长度不能超过50个字符")
    @Schema(description = "昵称", example = "张三")
    private String nickname;

    @Size(max = 100, message = "邮箱长度不能超过100个字符")
    @Schema(description = "邮箱", example = "user@example.com")
    private String email;

    @Size(max = 20, message = "手机号长度不能超过20个字符")
    @Schema(description = "手机号", example = "13800138000")
    private String phone;
}
