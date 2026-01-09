package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 管理员登录响应
 */
@Data
@Schema(description = "管理员登录响应")
public class AdminLoginResponse {

    @Schema(description = "访问令牌")
    private String token;

    @Schema(description = "管理员ID")
    private Long adminId;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "真实姓名")
    private String realName;

    @Schema(description = "角色: SYSTEM_ADMIN-系统管理员 SITE_ADMIN-站点管理员")
    private String role;

    @Schema(description = "所属站点ID")
    private Long siteId;

    @Schema(description = "所属站点名称")
    private String siteName;
}
