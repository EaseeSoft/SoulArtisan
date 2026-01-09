package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * Dashboard 趋势数据响应
 */
@Data
@Schema(description = "Dashboard 趋势数据")
public class DashboardTrendResponse {

    @Schema(description = "日期列表（如：[\"2024-01-01\", \"2024-01-02\", ...]）")
    private List<String> dates;

    @Schema(description = "用户增长数据")
    private List<Long> userGrowth;

    @Schema(description = "图片任务数据")
    private List<Long> imageTasks;

    @Schema(description = "视频任务数据")
    private List<Long> videoTasks;

    @Schema(description = "项目数据")
    private List<Long> projects;
}
