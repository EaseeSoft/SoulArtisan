package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 管理员信息响应
 */
@Data
@Schema(description = "管理员信息响应")
public class AdminInfoResponse {

    @Schema(description = "管理员ID")
    private Long id;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "真实姓名")
    private String realName;

    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "邮箱")
    private String email;

    @Schema(description = "头像")
    private String avatar;

    @Schema(description = "角色: SYSTEM_ADMIN-系统管理员 SITE_ADMIN-站点管理员")
    private String role;

    @Schema(description = "所属站点ID")
    private Long siteId;

    @Schema(description = "所属站点名称")
    private String siteName;

    @Schema(description = "状态: 0-禁用 1-启用")
    private Integer status;

    @Schema(description = "最后登录时间")
    private LocalDateTime lastLoginTime;

    @Schema(description = "最后登录IP")
    private String lastLoginIp;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;
}
