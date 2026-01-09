package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * Dashboard 统计数据响应
 */
@Data
@Schema(description = "Dashboard 统计数据")
public class DashboardStatsResponse {

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

    @Schema(description = "总图片任务数")
    private Long totalImageTasks;

    @Schema(description = "总视频任务数")
    private Long totalVideoTasks;

    @Schema(description = "今日新增图片任务数")
    private Long todayNewImageTasks;

    @Schema(description = "今日新增视频任务数")
    private Long todayNewVideoTasks;

    @Schema(description = "图片任务完成率（%）")
    private Double imageTaskCompletionRate;

    @Schema(description = "视频任务完成率（%）")
    private Double videoTaskCompletionRate;

    @Schema(description = "总项目数")
    private Long totalProjects;

    @Schema(description = "今日新增项目数")
    private Long todayNewProjects;

    @Schema(description = "总角色数")
    private Long totalCharacters;

    @Schema(description = "今日新增角色数")
    private Long todayNewCharacters;
}
