package com.jf.soulartisan.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 用户查询请求
 */
@Data
@Schema(description = "用户查询请求")
public class UserQueryRequest {

    @Schema(description = "用户名（模糊搜索）")
    private String username;

    @Schema(description = "昵称（模糊搜索）")
    private String nickname;

    @Schema(description = "邮箱（模糊搜索）")
    private String email;

    @Schema(description = "手机号（模糊搜索）")
    private String phone;

    @Schema(description = "用户状态: 0-禁用, 1-启用")
    private Integer status;

    @Schema(description = "站点ID（系统管理员可指定，站点管理员自动使用当前站点）")
    private Long siteId;
}
