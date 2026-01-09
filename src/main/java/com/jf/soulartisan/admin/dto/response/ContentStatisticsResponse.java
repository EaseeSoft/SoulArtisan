package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 内容统计响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "内容统计数据")
public class ContentStatisticsResponse {

    @Schema(description = "图片任务统计")
    private TaskStatistics imageTaskStats;

    @Schema(description = "视频任务统计")
    private TaskStatistics videoTaskStats;

    @Schema(description = "项目统计")
    private ProjectStatistics projectStats;

    @Schema(description = "角色统计")
    private CharacterStatistics characterStats;

    /**
     * 任务统计
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskStatistics {
        @Schema(description = "任务总数")
        private Integer totalTasks;

        @Schema(description = "今日新增")
        private Integer todayNewTasks;

        @Schema(description = "本周新增")
        private Integer weekNewTasks;

        @Schema(description = "本月新增")
        private Integer monthNewTasks;

        @Schema(description = "待处理任务")
        private Integer pendingTasks;

        @Schema(description = "进行中任务")
        private Integer processingTasks;

        @Schema(description = "已完成任务")
        private Integer completedTasks;

        @Schema(description = "失败任务")
        private Integer failedTasks;

        @Schema(description = "完成率")
        private Double completionRate;

        @Schema(description = "失败率")
        private Double failureRate;

        @Schema(description = "任务创建趋势（最近30天）")
        private List<TrendData> creationTrend;

        @Schema(description = "热门模型统计")
        private List<ModelStats> popularModels;

        @Schema(description = "错误分析（Top 10）")
        private List<ErrorStats> errorAnalysis;
    }

    /**
     * 项目统计
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectStatistics {
        @Schema(description = "项目总数")
        private Integer totalProjects;

        @Schema(description = "今日新增")
        private Integer todayNewProjects;

        @Schema(description = "本周新增")
        private Integer weekNewProjects;

        @Schema(description = "本月新增")
        private Integer monthNewProjects;
    }

    /**
     * 角色统计
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CharacterStatistics {
        @Schema(description = "角色总数")
        private Integer totalCharacters;

        @Schema(description = "今日新增")
        private Integer todayNewCharacters;

        @Schema(description = "本周新增")
        private Integer weekNewCharacters;

        @Schema(description = "本月新增")
        private Integer monthNewCharacters;
    }

    /**
     * 趋势数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendData {
        @Schema(description = "日期")
        private String date;

        @Schema(description = "数量")
        private Integer count;
    }

    /**
     * 模型统计
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ModelStats {
        @Schema(description = "模型名称")
        private String model;

        @Schema(description = "使用次数")
        private Integer count;

        @Schema(description = "占比")
        private Double percentage;
    }

    /**
     * 错误统计
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorStats {
        @Schema(description = "错误消息")
        private String errorMessage;

        @Schema(description = "出现次数")
        private Integer count;

        @Schema(description = "占比")
        private Double percentage;
    }
}
