package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 用户详情响应
 */
@Data
@Schema(description = "用户详情响应")
public class UserDetailResponse {

    @Schema(description = "用户ID")
    private Long id;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "昵称")
    private String nickname;

    @Schema(description = "邮箱")
    private String email;

    @Schema(description = "手机号")
    private String phone;

    @Schema(description = "积分")
    private Integer points;

    @Schema(description = "角色")
    private String role;

    @Schema(description = "站点ID")
    private Long siteId;

    @Schema(description = "站点名称")
    private String siteName;

    @Schema(description = "用户状态: 0-禁用, 1-启用")
    private Integer status;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;

    @Schema(description = "项目数量")
    private Long projectCount;

    @Schema(description = "图片任务数量")
    private Long imageTaskCount;

    @Schema(description = "视频任务数量")
    private Long videoTaskCount;
}
