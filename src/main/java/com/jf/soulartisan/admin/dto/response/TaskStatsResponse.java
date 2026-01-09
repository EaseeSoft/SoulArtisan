package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 任务统计响应
 */
@Data
@Schema(description = "任务统计")
public class TaskStatsResponse {

    @Schema(description = "总图片任务数")
    private Long totalImageTasks;

    @Schema(description = "总视频任务数")
    private Long totalVideoTasks;

    @Schema(description = "待处理图片任务数")
    private Long pendingImageTasks;

    @Schema(description = "待处理视频任务数")
    private Long pendingVideoTasks;

    @Schema(description = "处理中图片任务数")
    private Long processingImageTasks;

    @Schema(description = "运行中视频任务数")
    private Long runningVideoTasks;

    @Schema(description = "已完成图片任务数")
    private Long completedImageTasks;

    @Schema(description = "已成功视频任务数")
    private Long succeededVideoTasks;

    @Schema(description = "失败图片任务数")
    private Long failedImageTasks;

    @Schema(description = "失败视频任务数")
    private Long errorVideoTasks;

    @Schema(description = "今日新增图片任务数")
    private Long todayNewImageTasks;

    @Schema(description = "今日新增视频任务数")
    private Long todayNewVideoTasks;

    @Schema(description = "本周新增图片任务数")
    private Long weekNewImageTasks;

    @Schema(description = "本周新增视频任务数")
    private Long weekNewVideoTasks;

    @Schema(description = "本月新增图片任务数")
    private Long monthNewImageTasks;

    @Schema(description = "本月新增视频任务数")
    private Long monthNewVideoTasks;
}
