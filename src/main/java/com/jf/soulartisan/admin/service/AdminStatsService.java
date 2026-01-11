package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.admin.context.SiteContext;
import com.jf.soulartisan.admin.dto.response.ContentStatisticsResponse;
import com.jf.soulartisan.admin.dto.response.UserStatisticsResponse;
import com.jf.soulartisan.admin.entity.Site;
import com.jf.soulartisan.admin.mapper.SiteMapper;
import com.jf.soulartisan.entity.ImageGenerationTask;
import com.jf.soulartisan.entity.User;
import com.jf.soulartisan.entity.VideoGenerationTask;
import com.jf.soulartisan.mapper.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 数据统计服务
 */
@Slf4j
@Service
public class AdminStatsService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private SiteMapper siteMapper;

    @Autowired
    private ImageGenerationTaskMapper imageTaskMapper;

    @Autowired
    private VideoGenerationTaskMapper videoTaskMapper;

    /**
     * 获取用户统计数据
     */
    public UserStatisticsResponse getUserStats() {
        Long currentSiteId = SiteContext.getSiteId();

        // 基础统计
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (currentSiteId != null) {
            wrapper.eq(User::getSiteId, currentSiteId);
        }

        Integer totalUsers = Math.toIntExact(userMapper.selectCount(wrapper));

        // 启用/禁用用户
        wrapper.clear();
        if (currentSiteId != null) {
            wrapper.eq(User::getSiteId, currentSiteId);
        }
        wrapper.eq(User::getStatus, 1);
        Integer activeUsers = Math.toIntExact(userMapper.selectCount(wrapper));
        Integer inactiveUsers = totalUsers - activeUsers;

        // 时间范围统计
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime weekStart = now.minusDays(7);
        LocalDateTime monthStart = now.minusDays(30);

        Integer todayNewUsers = countUsersByDateRange(currentSiteId, todayStart, now);
        Integer weekNewUsers = countUsersByDateRange(currentSiteId, weekStart, now);
        Integer monthNewUsers = countUsersByDateRange(currentSiteId, monthStart, now);

        // 用户增长趋势（最近30天）
        List<UserStatisticsResponse.TrendData> userGrowthTrend = getUserGrowthTrend(currentSiteId, 30);

        // 按站点分布（仅系统管理员）
        List<UserStatisticsResponse.SiteDistribution> userDistributionBySite = null;
        if (currentSiteId == null) {
            userDistributionBySite = getUserDistributionBySite();
        }

        return UserStatisticsResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(inactiveUsers)
                .todayNewUsers(todayNewUsers)
                .weekNewUsers(weekNewUsers)
                .monthNewUsers(monthNewUsers)
                .userGrowthTrend(userGrowthTrend)
                .userDistributionBySite(userDistributionBySite)
                .build();
    }

    /**
     * 获取内容统计数据
     */
    public ContentStatisticsResponse getContentStats() {
        Long currentSiteId = SiteContext.getSiteId();

        // 图片任务统计
        ContentStatisticsResponse.TaskStatistics imageTaskStats = getTaskStatistics(
                currentSiteId,
                true // isImageTask
        );

        // 视频任务统计
        ContentStatisticsResponse.TaskStatistics videoTaskStats = getTaskStatistics(
                currentSiteId,
                false // isVideoTask
        );

        return ContentStatisticsResponse.builder()
                .imageTaskStats(imageTaskStats)
                .videoTaskStats(videoTaskStats)
                .build();
    }

    // ==================== 辅助方法 ====================

    private Integer countUsersByDateRange(Long siteId, LocalDateTime start, LocalDateTime end) {
        LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(User::getSiteId, siteId);
        }
        wrapper.between(User::getCreatedAt, start, end);
        return Math.toIntExact(userMapper.selectCount(wrapper));
    }

    private List<UserStatisticsResponse.TrendData> getUserGrowthTrend(Long siteId, int days) {
        List<UserStatisticsResponse.TrendData> trendData = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime end = LocalDateTime.of(date, LocalTime.MAX);

            Integer count = countUsersByDateRange(siteId, start, end);

            trendData.add(UserStatisticsResponse.TrendData.builder()
                    .date(date.format(DATE_FORMATTER))
                    .count(count)
                    .build());
        }

        return trendData;
    }

    private List<UserStatisticsResponse.SiteDistribution> getUserDistributionBySite() {
        List<Site> sites = siteMapper.selectList(null);
        List<UserStatisticsResponse.SiteDistribution> distribution = new ArrayList<>();

        for (Site site : sites) {
            LambdaQueryWrapper<User> wrapper = new LambdaQueryWrapper<>();
            wrapper.eq(User::getSiteId, site.getId());
            Integer userCount = Math.toIntExact(userMapper.selectCount(wrapper));

            distribution.add(UserStatisticsResponse.SiteDistribution.builder()
                    .siteId(site.getId())
                    .siteName(site.getSiteName())
                    .userCount(userCount)
                    .build());
        }

        return distribution;
    }

    private ContentStatisticsResponse.TaskStatistics getTaskStatistics(Long siteId, boolean isImageTask) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime weekStart = now.minusDays(7);
        LocalDateTime monthStart = now.minusDays(30);

        if (isImageTask) {
            return getImageTaskStatistics(siteId, todayStart, weekStart, monthStart, now);
        } else {
            return getVideoTaskStatistics(siteId, todayStart, weekStart, monthStart, now);
        }
    }

    private ContentStatisticsResponse.TaskStatistics getImageTaskStatistics(
            Long siteId, LocalDateTime todayStart, LocalDateTime weekStart, LocalDateTime monthStart, LocalDateTime now) {

        LambdaQueryWrapper<ImageGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(ImageGenerationTask::getSiteId, siteId);
        }

        Integer totalTasks = Math.toIntExact(imageTaskMapper.selectCount(wrapper));

        // 各状态任务数
        Integer pendingTasks = countImageTasksByStatus(siteId, "pending");
        Integer processingTasks = countImageTasksByStatus(siteId, "processing");
        Integer completedTasks = countImageTasksByStatus(siteId, "completed");
        Integer failedTasks = countImageTasksByStatus(siteId, "failed");

        // 今日/周/月新增
        Integer todayNewTasks = countImageTasksByDateRange(siteId, todayStart, now);
        Integer weekNewTasks = countImageTasksByDateRange(siteId, weekStart, now);
        Integer monthNewTasks = countImageTasksByDateRange(siteId, monthStart, now);

        // 完成率和失败率
        double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;
        double failureRate = totalTasks > 0 ? (failedTasks * 100.0 / totalTasks) : 0;

        // 趋势数据
        List<ContentStatisticsResponse.TrendData> creationTrend = getImageTaskCreationTrend(siteId, 30);

        // 热门模型（图片任务一般没有model字段，这里可以基于type或其他字段）
        List<ContentStatisticsResponse.ModelStats> popularModels = new ArrayList<>();

        // 错误分析
        List<ContentStatisticsResponse.ErrorStats> errorAnalysis = getImageTaskErrorAnalysis(siteId);

        return ContentStatisticsResponse.TaskStatistics.builder()
                .totalTasks(totalTasks)
                .todayNewTasks(todayNewTasks)
                .weekNewTasks(weekNewTasks)
                .monthNewTasks(monthNewTasks)
                .pendingTasks(pendingTasks)
                .processingTasks(processingTasks)
                .completedTasks(completedTasks)
                .failedTasks(failedTasks)
                .completionRate(completionRate)
                .failureRate(failureRate)
                .creationTrend(creationTrend)
                .popularModels(popularModels)
                .errorAnalysis(errorAnalysis)
                .build();
    }

    private ContentStatisticsResponse.TaskStatistics getVideoTaskStatistics(
            Long siteId, LocalDateTime todayStart, LocalDateTime weekStart, LocalDateTime monthStart, LocalDateTime now) {

        LambdaQueryWrapper<VideoGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(VideoGenerationTask::getSiteId, siteId);
        }

        Integer totalTasks = Math.toIntExact(videoTaskMapper.selectCount(wrapper));

        // 各状态任务数
        Integer pendingTasks = countVideoTasksByStatus(siteId, "pending");
        Integer processingTasks = countVideoTasksByStatus(siteId, "running");
        Integer completedTasks = countVideoTasksByStatus(siteId, "succeeded");
        Integer failedTasks = countVideoTasksByStatus(siteId, "error");

        // 今日/周/月新增
        Integer todayNewTasks = countVideoTasksByDateRange(siteId, todayStart, now);
        Integer weekNewTasks = countVideoTasksByDateRange(siteId, weekStart, now);
        Integer monthNewTasks = countVideoTasksByDateRange(siteId, monthStart, now);

        // 完成率和失败率
        double completionRate = totalTasks > 0 ? (completedTasks * 100.0 / totalTasks) : 0;
        double failureRate = totalTasks > 0 ? (failedTasks * 100.0 / totalTasks) : 0;

        // 趋势数据
        List<ContentStatisticsResponse.TrendData> creationTrend = getVideoTaskCreationTrend(siteId, 30);

        // 热门模型
        List<ContentStatisticsResponse.ModelStats> popularModels = getVideoTaskPopularModels(siteId);

        // 错误分析
        List<ContentStatisticsResponse.ErrorStats> errorAnalysis = getVideoTaskErrorAnalysis(siteId);

        return ContentStatisticsResponse.TaskStatistics.builder()
                .totalTasks(totalTasks)
                .todayNewTasks(todayNewTasks)
                .weekNewTasks(weekNewTasks)
                .monthNewTasks(monthNewTasks)
                .pendingTasks(pendingTasks)
                .processingTasks(processingTasks)
                .completedTasks(completedTasks)
                .failedTasks(failedTasks)
                .completionRate(completionRate)
                .failureRate(failureRate)
                .creationTrend(creationTrend)
                .popularModels(popularModels)
                .errorAnalysis(errorAnalysis)
                .build();
    }

    private Integer countImageTasksByStatus(Long siteId, String status) {
        LambdaQueryWrapper<ImageGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(ImageGenerationTask::getSiteId, siteId);
        }
        wrapper.eq(ImageGenerationTask::getStatus, status);
        return Math.toIntExact(imageTaskMapper.selectCount(wrapper));
    }

    private Integer countVideoTasksByStatus(Long siteId, String status) {
        LambdaQueryWrapper<VideoGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(VideoGenerationTask::getSiteId, siteId);
        }
        wrapper.eq(VideoGenerationTask::getStatus, status);
        return Math.toIntExact(videoTaskMapper.selectCount(wrapper));
    }

    private Integer countImageTasksByDateRange(Long siteId, LocalDateTime start, LocalDateTime end) {
        LambdaQueryWrapper<ImageGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(ImageGenerationTask::getSiteId, siteId);
        }
        wrapper.between(ImageGenerationTask::getCreatedAt, start, end);
        return Math.toIntExact(imageTaskMapper.selectCount(wrapper));
    }

    private Integer countVideoTasksByDateRange(Long siteId, LocalDateTime start, LocalDateTime end) {
        LambdaQueryWrapper<VideoGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(VideoGenerationTask::getSiteId, siteId);
        }
        wrapper.between(VideoGenerationTask::getCreatedAt, start, end);
        return Math.toIntExact(videoTaskMapper.selectCount(wrapper));
    }

    private List<ContentStatisticsResponse.TrendData> getImageTaskCreationTrend(Long siteId, int days) {
        List<ContentStatisticsResponse.TrendData> trendData = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime end = LocalDateTime.of(date, LocalTime.MAX);

            Integer count = countImageTasksByDateRange(siteId, start, end);

            trendData.add(ContentStatisticsResponse.TrendData.builder()
                    .date(date.format(DATE_FORMATTER))
                    .count(count)
                    .build());
        }

        return trendData;
    }

    private List<ContentStatisticsResponse.TrendData> getVideoTaskCreationTrend(Long siteId, int days) {
        List<ContentStatisticsResponse.TrendData> trendData = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime end = LocalDateTime.of(date, LocalTime.MAX);

            Integer count = countVideoTasksByDateRange(siteId, start, end);

            trendData.add(ContentStatisticsResponse.TrendData.builder()
                    .date(date.format(DATE_FORMATTER))
                    .count(count)
                    .build());
        }

        return trendData;
    }

    private List<ContentStatisticsResponse.ModelStats> getVideoTaskPopularModels(Long siteId) {
        LambdaQueryWrapper<VideoGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(VideoGenerationTask::getSiteId, siteId);
        }
        wrapper.select(VideoGenerationTask::getModel);
        List<VideoGenerationTask> tasks = videoTaskMapper.selectList(wrapper);

        Map<String, Long> modelCounts = tasks.stream()
                .filter(task -> task.getModel() != null)
                .collect(Collectors.groupingBy(VideoGenerationTask::getModel, Collectors.counting()));

        long total = tasks.size();

        return modelCounts.entrySet().stream()
                .map(entry -> ContentStatisticsResponse.ModelStats.builder()
                        .model(entry.getKey())
                        .count(entry.getValue().intValue())
                        .percentage(total > 0 ? (entry.getValue() * 100.0 / total) : 0)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .limit(10)
                .collect(Collectors.toList());
    }

    private List<ContentStatisticsResponse.ErrorStats> getImageTaskErrorAnalysis(Long siteId) {
        LambdaQueryWrapper<ImageGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(ImageGenerationTask::getSiteId, siteId);
        }
        wrapper.eq(ImageGenerationTask::getStatus, "failed");
        wrapper.select(ImageGenerationTask::getErrorMessage);
        List<ImageGenerationTask> failedTasks = imageTaskMapper.selectList(wrapper);

        Map<String, Long> errorCounts = failedTasks.stream()
                .filter(task -> task.getErrorMessage() != null && !task.getErrorMessage().isEmpty())
                .collect(Collectors.groupingBy(ImageGenerationTask::getErrorMessage, Collectors.counting()));

        long total = failedTasks.size();

        return errorCounts.entrySet().stream()
                .map(entry -> ContentStatisticsResponse.ErrorStats.builder()
                        .errorMessage(entry.getKey())
                        .count(entry.getValue().intValue())
                        .percentage(total > 0 ? (entry.getValue() * 100.0 / total) : 0)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .limit(10)
                .collect(Collectors.toList());
    }

    private List<ContentStatisticsResponse.ErrorStats> getVideoTaskErrorAnalysis(Long siteId) {
        LambdaQueryWrapper<VideoGenerationTask> wrapper = new LambdaQueryWrapper<>();
        if (siteId != null) {
            wrapper.eq(VideoGenerationTask::getSiteId, siteId);
        }
        wrapper.eq(VideoGenerationTask::getStatus, "error");
        wrapper.select(VideoGenerationTask::getErrorMessage);
        List<VideoGenerationTask> failedTasks = videoTaskMapper.selectList(wrapper);

        Map<String, Long> errorCounts = failedTasks.stream()
                .filter(task -> task.getErrorMessage() != null && !task.getErrorMessage().isEmpty())
                .collect(Collectors.groupingBy(VideoGenerationTask::getErrorMessage, Collectors.counting()));

        long total = failedTasks.size();

        return errorCounts.entrySet().stream()
                .map(entry -> ContentStatisticsResponse.ErrorStats.builder()
                        .errorMessage(entry.getKey())
                        .count(entry.getValue().intValue())
                        .percentage(total > 0 ? (entry.getValue() * 100.0 / total) : 0)
                        .build())
                .sorted((a, b) -> b.getCount().compareTo(a.getCount()))
                .limit(10)
                .collect(Collectors.toList());
    }
}
