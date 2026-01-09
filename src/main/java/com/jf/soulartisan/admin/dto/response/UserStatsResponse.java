package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 用户统计响应
 */
@Data
@Schema(description = "用户统计响应")
public class UserStatsResponse {

    @Schema(description = "总用户数")
    private Long totalUsers;

    @Schema(description = "启用用户数")
    private Long enabledUsers;

    @Schema(description = "禁用用户数")
    private Long disabledUsers;

    @Schema(description = "今日新增用户数")
    private Long todayNewUsers;

    @Schema(description = "本周新增用户数")
    private Long weekNewUsers;

    @Schema(description = "本月新增用户数")
    private Long monthNewUsers;
}
