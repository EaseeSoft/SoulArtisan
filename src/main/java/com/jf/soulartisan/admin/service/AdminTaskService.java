package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.admin.context.SiteContext;
import com.jf.soulartisan.admin.dto.request.TaskQueryRequest;
import com.jf.soulartisan.admin.dto.response.ImageTaskDetailResponse;
import com.jf.soulartisan.admin.dto.response.TaskStatsResponse;
import com.jf.soulartisan.admin.dto.response.VideoTaskDetailResponse;
import com.jf.soulartisan.admin.entity.Site;
import com.jf.soulartisan.admin.mapper.SiteMapper;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.util.BeanUtils;
import com.jf.soulartisan.entity.ImageGenerationTask;
import com.jf.soulartisan.entity.User;
import com.jf.soulartisan.entity.VideoGenerationTask;
import com.jf.soulartisan.mapper.ImageGenerationTaskMapper;
import com.jf.soulartisan.mapper.UserMapper;
import com.jf.soulartisan.mapper.VideoGenerationTaskMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

/**
 * 任务管理服务
 */
@Slf4j
@Service
public class AdminTaskService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    @Autowired
    private ImageGenerationTaskMapper imageTaskMapper;
    @Autowired
    private VideoGenerationTaskMapper videoTaskMapper;
    @Autowired
    private UserMapper userMapper;
    @Autowired
    private SiteMapper siteMapper;

    /**
     * 获取图片任务列表（自动按站点过滤）
     *
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @param request  查询请求
     * @return 图片任务列表
     */
    public PageResult<ImageTaskDetailResponse> getImageTaskList(Integer pageNum, Integer pageSize, TaskQueryRequest request) {
        Page<ImageGenerationTask> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<ImageGenerationTask> queryWrapper = new LambdaQueryWrapper<>();

        // 站点数据隔离：站点管理员只能查看自己站点的任务
        Long siteId = SiteContext.getSiteId();
        if (siteId != null) {
            queryWrapper.eq(ImageGenerationTask::getSiteId, siteId);
        } else if (request.getSiteId() != null) {
            // 系统管理员可以指定站点ID查询
            queryWrapper.eq(ImageGenerationTask::getSiteId, request.getSiteId());
        }

        // 查询条件
        if (request.getUserId() != null) {
            queryWrapper.eq(ImageGenerationTask::getUserId, request.getUserId());
        }
        if (StringUtils.hasText(request.getStatus())) {
            queryWrapper.eq(ImageGenerationTask::getStatus, request.getStatus());
        }
        if (StringUtils.hasText(request.getType())) {
            queryWrapper.eq(ImageGenerationTask::getType, request.getType());
        }
        if (StringUtils.hasText(request.getModel())) {
            queryWrapper.eq(ImageGenerationTask::getModel, request.getModel());
        }
        if (StringUtils.hasText(request.getStartTime())) {
            LocalDateTime startTime = LocalDateTime.parse(request.getStartTime(), DATE_TIME_FORMATTER);
            queryWrapper.ge(ImageGenerationTask::getCreatedAt, startTime);
        }
        if (StringUtils.hasText(request.getEndTime())) {
            LocalDateTime endTime = LocalDateTime.parse(request.getEndTime(), DATE_TIME_FORMATTER);
            queryWrapper.le(ImageGenerationTask::getCreatedAt, endTime);
        }

        queryWrapper.orderByDesc(ImageGenerationTask::getCreatedAt);

        Page<ImageGenerationTask> taskPage = imageTaskMapper.selectPage(page, queryWrapper);

        // 转换为响应对象
        PageResult<ImageTaskDetailResponse> pageResult = new PageResult<>();
        pageResult.setList(BeanUtils.toBean(taskPage.getRecords(), ImageTaskDetailResponse.class));
        pageResult.setTotal(taskPage.getTotal());
        pageResult.setPage(pageNum);
        pageResult.setPageSize(pageSize);

        // 填充用户名和站点名称
        for (int i = 0; i < pageResult.getList().size(); i++) {
            ImageTaskDetailResponse response = pageResult.getList().get(i);
            ImageGenerationTask task = taskPage.getRecords().get(i);

            // 填充用户名
            if (task.getUserId() != null) {
                User user = userMapper.selectById(task.getUserId());
                if (user != null) {
                    response.setUsername(user.getUsername());
                }
            }

            // 填充站点名称
            if (task.getSiteId() != null) {
                Site site = siteMapper.selectById(task.getSiteId());
                if (site != null) {
                    response.setSiteName(site.getSiteName());
                }
            }
        }

        return pageResult;
    }

    /**
     * 获取视频任务列表（自动按站点过滤）
     *
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @param request  查询请求
     * @return 视频任务列表
     */
    public PageResult<VideoTaskDetailResponse> getVideoTaskList(Integer pageNum, Integer pageSize, TaskQueryRequest request) {
        Page<VideoGenerationTask> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<VideoGenerationTask> queryWrapper = new LambdaQueryWrapper<>();

        // 站点数据隔离：站点管理员只能查看自己站点的任务
        Long siteId = SiteContext.getSiteId();
        if (siteId != null) {
            queryWrapper.eq(VideoGenerationTask::getSiteId, siteId);
        } else if (request.getSiteId() != null) {
            // 系统管理员可以指定站点ID查询
            queryWrapper.eq(VideoGenerationTask::getSiteId, request.getSiteId());
        }

        // 查询条件
        if (request.getUserId() != null) {
            queryWrapper.eq(VideoGenerationTask::getUserId, request.getUserId());
        }
        if (StringUtils.hasText(request.getStatus())) {
            queryWrapper.eq(VideoGenerationTask::getStatus, request.getStatus());
        }
        if (StringUtils.hasText(request.getModel())) {
            queryWrapper.eq(VideoGenerationTask::getModel, request.getModel());
        }
        if (StringUtils.hasText(request.getStartTime())) {
            LocalDateTime startTime = LocalDateTime.parse(request.getStartTime(), DATE_TIME_FORMATTER);
            queryWrapper.ge(VideoGenerationTask::getCreatedAt, startTime);
        }
        if (StringUtils.hasText(request.getEndTime())) {
            LocalDateTime endTime = LocalDateTime.parse(request.getEndTime(), DATE_TIME_FORMATTER);
            queryWrapper.le(VideoGenerationTask::getCreatedAt, endTime);
        }

        queryWrapper.orderByDesc(VideoGenerationTask::getCreatedAt);

        Page<VideoGenerationTask> taskPage = videoTaskMapper.selectPage(page, queryWrapper);

        // 转换为响应对象
        PageResult<VideoTaskDetailResponse> pageResult = new PageResult<>();
        pageResult.setList(BeanUtils.toBean(taskPage.getRecords(), VideoTaskDetailResponse.class));
        pageResult.setTotal(taskPage.getTotal());
        pageResult.setPage(pageNum);
        pageResult.setPageSize(pageSize);

        // 填充用户名和站点名称
        for (int i = 0; i < pageResult.getList().size(); i++) {
            VideoTaskDetailResponse response = pageResult.getList().get(i);
            VideoGenerationTask task = taskPage.getRecords().get(i);

            // 填充用户名
            if (task.getUserId() != null) {
                User user = userMapper.selectById(task.getUserId());
                if (user != null) {
                    response.setUsername(user.getUsername());
                }
            }

            // 填充站点名称
            if (task.getSiteId() != null) {
                Site site = siteMapper.selectById(task.getSiteId());
                if (site != null) {
                    response.setSiteName(site.getSiteName());
                }
            }
        }

        return pageResult;
    }

    /**
     * 获取图片任务详情
     *
     * @param taskId 任务ID
     * @return 任务详情
     */
    public ImageTaskDetailResponse getImageTaskDetail(Long taskId) {
        ImageGenerationTask task = imageTaskMapper.selectById(taskId);
        if (task == null) {
            throw new ServiceException("任务不存在");
        }

        // 站点数据隔离检查
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && !currentSiteId.equals(task.getSiteId())) {
            throw new ServiceException("无权限访问该任务");
        }

        ImageTaskDetailResponse response = BeanUtils.toBean(task, ImageTaskDetailResponse.class);

        // 填充用户名
        if (task.getUserId() != null) {
            User user = userMapper.selectById(task.getUserId());
            if (user != null) {
                response.setUsername(user.getUsername());
            }
        }

        // 填充站点名称
        if (task.getSiteId() != null) {
            Site site = siteMapper.selectById(task.getSiteId());
            if (site != null) {
                response.setSiteName(site.getSiteName());
            }
        }

        return response;
    }

    /**
     * 获取视频任务详情
     *
     * @param taskId 任务ID
     * @return 任务详情
     */
    public VideoTaskDetailResponse getVideoTaskDetail(Long taskId) {
        VideoGenerationTask task = videoTaskMapper.selectById(taskId);
        if (task == null) {
            throw new ServiceException("任务不存在");
        }

        // 站点数据隔离检查
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && !currentSiteId.equals(task.getSiteId())) {
            throw new ServiceException("无权限访问该任务");
        }

        VideoTaskDetailResponse response = BeanUtils.toBean(task, VideoTaskDetailResponse.class);

        // 填充用户名
        if (task.getUserId() != null) {
            User user = userMapper.selectById(task.getUserId());
            if (user != null) {
                response.setUsername(user.getUsername());
            }
        }

        // 填充站点名称
        if (task.getSiteId() != null) {
            Site site = siteMapper.selectById(task.getSiteId());
            if (site != null) {
                response.setSiteName(site.getSiteName());
            }
        }

        return response;
    }

    /**
     * 添加管理员备注
     *
     * @param taskId  任务ID
     * @param remark  备注内容
     * @param isImage 是否图片任务
     */
    @Transactional(rollbackFor = Exception.class)
    public void addTaskRemark(Long taskId, String remark, boolean isImage) {
        if (isImage) {
            ImageGenerationTask task = imageTaskMapper.selectById(taskId);
            if (task == null) {
                throw new ServiceException("任务不存在");
            }

            // 站点数据隔离检查
            Long currentSiteId = SiteContext.getSiteId();
            if (currentSiteId != null && !currentSiteId.equals(task.getSiteId())) {
                throw new ServiceException("无权限操作该任务");
            }

            task.setAdminRemark(remark);
            imageTaskMapper.updateById(task);
        } else {
            VideoGenerationTask task = videoTaskMapper.selectById(taskId);
            if (task == null) {
                throw new ServiceException("任务不存在");
            }

            // 站点数据隔离检查
            Long currentSiteId = SiteContext.getSiteId();
            if (currentSiteId != null && !currentSiteId.equals(task.getSiteId())) {
                throw new ServiceException("无权限操作该任务");
            }

            task.setAdminRemark(remark);
            videoTaskMapper.updateById(task);
        }

        log.info("添加任务备注成功: taskId={}, isImage={}", taskId, isImage);
    }

    /**
     * 获取任务统计数据
     *
     * @return 统计数据
     */
    public TaskStatsResponse getTaskStats() {
        TaskStatsResponse stats = new TaskStatsResponse();

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

        // 图片任务统计
        LambdaQueryWrapper<ImageGenerationTask> imageWrapper = new LambdaQueryWrapper<>();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        stats.setTotalImageTasks(imageTaskMapper.selectCount(imageWrapper));

        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.eq(ImageGenerationTask::getStatus, ImageGenerationTask.Status.PENDING);
        stats.setPendingImageTasks(imageTaskMapper.selectCount(imageWrapper));

        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.eq(ImageGenerationTask::getStatus, ImageGenerationTask.Status.PROCESSING);
        stats.setProcessingImageTasks(imageTaskMapper.selectCount(imageWrapper));

        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.eq(ImageGenerationTask::getStatus, ImageGenerationTask.Status.COMPLETED);
        stats.setCompletedImageTasks(imageTaskMapper.selectCount(imageWrapper));

        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.eq(ImageGenerationTask::getStatus, ImageGenerationTask.Status.FAILED);
        stats.setFailedImageTasks(imageTaskMapper.selectCount(imageWrapper));

        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.between(ImageGenerationTask::getCreatedAt, todayStart, todayEnd);
        stats.setTodayNewImageTasks(imageTaskMapper.selectCount(imageWrapper));

        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.between(ImageGenerationTask::getCreatedAt, weekStart, weekEnd);
        stats.setWeekNewImageTasks(imageTaskMapper.selectCount(imageWrapper));

        imageWrapper.clear();
        if (currentSiteId != null) {
            imageWrapper.eq(ImageGenerationTask::getSiteId, currentSiteId);
        }
        imageWrapper.between(ImageGenerationTask::getCreatedAt, monthStart, monthEnd);
        stats.setMonthNewImageTasks(imageTaskMapper.selectCount(imageWrapper));

        // 视频任务统计
        LambdaQueryWrapper<VideoGenerationTask> videoWrapper = new LambdaQueryWrapper<>();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        stats.setTotalVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.eq(VideoGenerationTask::getStatus, VideoGenerationTask.Status.PENDING);
        stats.setPendingVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.eq(VideoGenerationTask::getStatus, VideoGenerationTask.Status.RUNNING);
        stats.setRunningVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.eq(VideoGenerationTask::getStatus, VideoGenerationTask.Status.SUCCEEDED);
        stats.setSucceededVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.eq(VideoGenerationTask::getStatus, VideoGenerationTask.Status.ERROR);
        stats.setErrorVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.between(VideoGenerationTask::getCreatedAt, todayStart, todayEnd);
        stats.setTodayNewVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.between(VideoGenerationTask::getCreatedAt, weekStart, weekEnd);
        stats.setWeekNewVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        videoWrapper.clear();
        if (currentSiteId != null) {
            videoWrapper.eq(VideoGenerationTask::getSiteId, currentSiteId);
        }
        videoWrapper.between(VideoGenerationTask::getCreatedAt, monthStart, monthEnd);
        stats.setMonthNewVideoTasks(videoTaskMapper.selectCount(videoWrapper));

        return stats;
    }
}
