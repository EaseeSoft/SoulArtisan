package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.admin.context.SiteContext;
import com.jf.soulartisan.admin.dto.response.DashboardStatsResponse;
import com.jf.soulartisan.admin.dto.response.DashboardTrendResponse;
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

/**
 * Dashboard 服务
 */
@Slf4j
@Service
public class AdminDashboardService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private ImageGenerationTaskMapper imageTaskMapper;
    @Autowired
    private VideoGenerationTaskMapper videoTaskMapper;

    /**
     * 获取系统统计数据（自动按站点过滤）
     *
     * @return 统计数据
     */
    public DashboardStatsResponse getSystemStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse();

        Long currentSiteId = SiteContext.getSiteId();

        // 今日时间范围
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        // 本周时间范围
        LocalDate today = LocalDate.now();
        LocalDateTime weekStart = LocalDateTime.of(today.minusDays(today.getDayOfWeek().getValue() - 1), LocalTime.MIN);
        LocalDateTime weekEnd = LocalDateTime.of(today, LocalTime.MAX);

        // 本月时间范围
        LocalDateTime monthStart = LocalDateTime.of(today.withDayOfMonth(1), LocalTime.MIN);
        LocalDateTime monthEnd = LocalDateTime.of(today, LocalTime.MAX);

        // 用户统计
        LambdaQueryWrapper<User> userWrapper = new LambdaQueryWrapper<>();
        if (currentSiteId != null) {
            userWrapper.eq(User::getSiteId, currentSiteId);
        }
        stats.setTotalUsers(userMapper.selectCount(userWrapper));

        userWrapper.clear();
        if (currentSiteId != null) {
            userWrapper.eq(User::getSiteId, currentSiteId);
        }
        userWrapper.eq(User::getStatus, User.Status.ENABLED);
        stats.setEnabledUsers(userMapper.selectCount(userWrapper));

        userWrapper.clear();
        if (currentSiteId != null) {
            userWrapper.eq(User::getSiteId, currentSiteId);
        }
        userWrapper.eq(User::getStatus, User.Status.DISABLED);
        stats.setDisabledUsers(userMapper.selectCount(userWrapper));

        userWrapper.clear();
        if (currentSiteId != null) {
            userWrapper.eq(User::getSiteId, currentSiteId);
        }
        userWrapper.between(User::getCreatedAt, todayStart, todayEnd);
        stats.setTodayNewUsers(userMapper.selectCount(userWrapper));

        userWrapper.clear();
        if (currentSiteId != null) {
            userWrapper.eq(User::getSiteId, currentSiteId);
        }
        userWrapper.between(User::getCreatedAt, weekStart, weekEnd);
        stats.setWeekNewUsers(userMapper.selectCount(userWrapper));

        userWrapper.clear();
        if (currentSiteId != null) {
            userWrapper.eq(User::getSiteId, currentSiteId);
        }
        userWrapper.between(User::getCreatedAt, monthStart, monthEnd);
        stats.setMonthNewUsers(userMapper.selectCount(userWrapper));

        // 图片任务统计
        LambdaQueryWrapper<ImageGenerationTask> imageWrapper = new LambdaQueryWrapper<>();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        long totalImageTasks = imageTaskMapper.selectCount(imageWrapper);
        stats.setTotalImageTasks(totalImageTasks);

        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.between(ImageGenerationTask::getCreatedAt, todayStart, todayEnd);
        stats.setTodayNewImageTasks(imageTaskMapper.selectCount(imageWrapper));

        // 计算图片任务完成率
        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.eq(ImageGenerationTask::getStatus, ImageGenerationTask.Status.COMPLETED);
        long completedImageTasks = imageTaskMapper.selectCount(imageWrapper);
        stats.setImageTaskCompletionRate(totalImageTasks > 0 ? (completedImageTasks * 100.0 / totalImageTasks) : 0.0);

        // 视频任务统计
        LambdaQueryWrapper<VideoGenerationTask> videoWrapper = new LambdaQueryWrapper<>();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        long totalVideoTasks = videoTaskMapper.selectCount(videoWrapper);
        stats.setTotalVideoTasks(totalVideoTasks);

        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.between(VideoGenerationTask::getCreatedAt, todayStart, todayEnd);
        stats.setTodayNewVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        // 计算视频任务完成率
        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.eq(VideoGenerationTask::getStatus, VideoGenerationTask.Status.SUCCEEDED);
        long succeededVideoTasks = videoTaskMapper.selectCount(videoWrapper);
        stats.setVideoTaskCompletionRate(totalVideoTasks > 0 ? (succeededVideoTasks * 100.0 / totalVideoTasks) : 0.0);

        return stats;
    }

    /**
     * 获取趋势数据（最近7天或30天）
     *
     * @param days 天数（7或30）
     * @return 趋势数据
     */
    public DashboardTrendResponse getTrendData(Integer days) {
        if (days == null || (days != 7 && days != 30)) {
            days = 7;
        }

        DashboardTrendResponse trend = new DashboardTrendResponse();

        Long currentSiteId = SiteContext.getSiteId();

        List<String> dates = new ArrayList<>();
        List<Long> userGrowth = new ArrayList<>();
        List<Long> imageTasks = new ArrayList<>();
        List<Long> videoTasks = new ArrayList<>();
        List<Long> projects = new ArrayList<>();

        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            dates.add(date.format(DATE_FORMATTER));

            LocalDateTime dayStart = LocalDateTime.of(date, LocalTime.MIN);
            LocalDateTime dayEnd = LocalDateTime.of(date, LocalTime.MAX);

            // 统计当天新增用户数
            LambdaQueryWrapper<User> userWrapper = new LambdaQueryWrapper<>();
            if (currentSiteId != null) {
                userWrapper.eq(User::getSiteId, currentSiteId);
            }
            userWrapper.between(User::getCreatedAt, dayStart, dayEnd);
            userGrowth.add(userMapper.selectCount(userWrapper));

            // 统计当天新增图片任务数
            LambdaQueryWrapper<ImageGenerationTask> imageWrapper = new LambdaQueryWrapper<>();
            if (currentSiteId != null) {
                imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
            }
            imageWrapper.between(ImageGenerationTask::getCreatedAt, dayStart, dayEnd);
            imageTasks.add(imageTaskMapper.selectCount(imageWrapper));

            // 统计当天新增视频任务数
            LambdaQueryWrapper<VideoGenerationTask> videoWrapper = new LambdaQueryWrapper<>();
            if (currentSiteId != null) {
                videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
            }
            videoWrapper.between(VideoGenerationTask::getCreatedAt, dayStart, dayEnd);
            videoTasks.add(videoTaskMapper.selectCount(videoWrapper));
        }

        trend.setDates(dates);
        trend.setUserGrowth(userGrowth);
        trend.setImageTasks(imageTasks);
        trend.setVideoTasks(videoTasks);
        trend.setProjects(projects);

        return trend;
    }
}
