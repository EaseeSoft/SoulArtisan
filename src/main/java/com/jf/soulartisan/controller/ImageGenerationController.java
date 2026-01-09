package com.jf.soulartisan.controller;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.admin.entity.PointsConfig;
import com.jf.soulartisan.admin.service.ConcurrencyLimitService;
import com.jf.soulartisan.common.dto.*;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.entity.ImageGenerationTask;
import com.jf.soulartisan.mapper.ImageGenerationTaskMapper;
import com.jf.soulartisan.service.ImageTaskPollingService;
import com.jf.soulartisan.service.NanoBananaService;
import com.jf.soulartisan.service.PointsDeductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/image")
@Tag(name = "图像生成接口")
@SaUserCheckLogin
public class ImageGenerationController {

    @Resource
    private NanoBananaService nanoBananaService;

    @Resource
    private ImageGenerationTaskMapper imageGenerationTaskMapper;

    @Resource
    private ImageTaskPollingService imageTaskPollingService;

    @Resource
    private PointsDeductService pointsDeductService;

    @Resource
    private ConcurrencyLimitService concurrencyLimitService;

    @PostMapping("/text-to-image")
    @Operation(summary = "文生图")
    public Result<?> textToImage(@Valid @RequestBody TextToImageRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        // 并发检查（按用户统计）- 使用原子操作获取槽位
        ConcurrencyCheckResult concurrencyResult = concurrencyLimitService.checkImageConcurrency(userId);
        if (!concurrencyResult.isAllowed()) {
            return Result.error(concurrencyResult.getMessage(), 429);
        }

        // 检查积分是否充足
        if (!pointsDeductService.checkBalance(userId, PointsConfig.ConfigKey.IMAGE_GENERATION)) {
            // 积分不足，释放并发槽位
            concurrencyLimitService.releaseImageSlot(userId);
            Integer requiredPoints = pointsDeductService.getRequiredPoints(userId, PointsConfig.ConfigKey.IMAGE_GENERATION);
            return Result.error("积分不足，需要" + requiredPoints + "积分", 400);
        }

        try {
            JSONObject response = nanoBananaService.textToImage(
                    siteId,
                    request.getPrompt(),
                    request.getModel(),
                    request.getAspectRatio(),
                    request.getImageSize()
            );

            if (response == null) {
                // 创建失败，释放并发槽位
                concurrencyLimitService.releaseImageSlot(userId);
                return Result.error("调用图像生成服务失败", 500);
            }

            String taskId = nanoBananaService.extractTaskId(response);
            if (StrUtil.isBlank(taskId)) {
                // 创建失败，释放并发槽位
                concurrencyLimitService.releaseImageSlot(userId);
                return Result.error("获取任务ID失败", 500);
            }

            ImageGenerationTask task = new ImageGenerationTask();
            task.setUserId(userId);
            task.setSiteId(siteId);
            task.setTaskId(taskId);
            task.setType(ImageGenerationTask.Type.TEXT2IMAGE);
            task.setModel(request.getModel());
            task.setPrompt(request.getPrompt());
            task.setAspectRatio(request.getAspectRatio());
            task.setImageSize(request.getImageSize());
            task.setStatus(ImageGenerationTask.Status.PENDING);

            int result = imageGenerationTaskMapper.insert(task);
            if (result <= 0) {
                log.error("保存任务失败: user_id={}", userId);
                // 保存失败，释放并发槽位
                concurrencyLimitService.releaseImageSlot(userId);
                return Result.error("保存任务失败", 500);
            }

            // 扣除积分
            try {
                pointsDeductService.deductForImageGeneration(userId, task.getId(), ImageGenerationTask.Type.TEXT2IMAGE);
            } catch (Exception e) {
                log.error("扣除积分失败: {}", e.getMessage());
                // 积分扣除失败，删除任务
                imageGenerationTaskMapper.deleteById(task.getId());
                // 释放并发槽位
                concurrencyLimitService.releaseImageSlot(userId);
                return Result.error("扣除积分失败: " + e.getMessage(), 400);
            }

            log.info("任务保存成功: id={}, task_id={}", task.getId(), taskId);

            // 启动轮询服务（如果未运行）
            imageTaskPollingService.startPolling();

            Map<String, Object> data = new HashMap<>();
            data.put("id", task.getId());
            data.put("taskId", taskId);
            data.put("status", task.getStatus());
            data.put("createdAt", task.getCreatedAt());

            return Result.success(data, "任务创建成功");

        } catch (Exception e) {
            log.error("创建任务失败: {}", e.getMessage(), e);
            // 异常时释放并发槽位
            concurrencyLimitService.releaseImageSlot(userId);
            return Result.error("创建任务失败: " + e.getMessage(), 500);
        }
    }

    @PostMapping("/image-to-image")
    @Operation(summary = "图生图")
    public Result<?> imageToImage(@Valid @RequestBody ImageToImageRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        // 并发检查（按用户统计）- 使用原子操作获取槽位
        ConcurrencyCheckResult concurrencyResult = concurrencyLimitService.checkImageConcurrency(userId);
        if (!concurrencyResult.isAllowed()) {
            return Result.error(concurrencyResult.getMessage(), 429);
        }

        // 检查积分是否充足
        if (!pointsDeductService.checkBalance(userId, PointsConfig.ConfigKey.IMAGE_GENERATION)) {
            // 积分不足，释放并发槽位
            concurrencyLimitService.releaseImageSlot(userId);
            Integer requiredPoints = pointsDeductService.getRequiredPoints(userId, PointsConfig.ConfigKey.IMAGE_GENERATION);
            return Result.error("积分不足，需要" + requiredPoints + "积分", 400);
        }

        try {
            JSONObject response = nanoBananaService.imageToImage(
                    siteId,
                    request.getPrompt(),
                    request.getImageUrls(),
                    request.getModel(),
                    request.getAspectRatio(),
                    request.getImageSize()
            );

            if (response == null) {
                // 创建失败，释放并发槽位
                concurrencyLimitService.releaseImageSlot(userId);
                return Result.error("调用图像生成服务失败", 500);
            }

            String taskId = nanoBananaService.extractTaskId(response);
            if (StrUtil.isBlank(taskId)) {
                // 创建失败，释放并发槽位
                concurrencyLimitService.releaseImageSlot(userId);
                return Result.error("获取任务ID失败", 500);
            }

            ImageGenerationTask task = new ImageGenerationTask();
            task.setUserId(userId);
            task.setSiteId(siteId);
            task.setTaskId(taskId);
            task.setType(ImageGenerationTask.Type.IMAGE2IMAGE);
            task.setModel(request.getModel());
            task.setPrompt(request.getPrompt());
            task.setImageUrls(request.getImageUrls());
            task.setAspectRatio(request.getAspectRatio());
            task.setImageSize(request.getImageSize());
            task.setStatus(ImageGenerationTask.Status.PENDING);

            int result = imageGenerationTaskMapper.insert(task);
            if (result <= 0) {
                log.error("保存图生图任务失败: user_id={}", userId);
                // 保存失败，释放并发槽位
                concurrencyLimitService.releaseImageSlot(userId);
                return Result.error("保存任务失败", 500);
            }

            // 扣除积分
            try {
                pointsDeductService.deductForImageGeneration(userId, task.getId(), ImageGenerationTask.Type.IMAGE2IMAGE);
            } catch (Exception e) {
                log.error("扣除积分失败: {}", e.getMessage());
                // 积分扣除失败，删除任务
                imageGenerationTaskMapper.deleteById(task.getId());
                // 释放并发槽位
                concurrencyLimitService.releaseImageSlot(userId);
                return Result.error("扣除积分失败: " + e.getMessage(), 400);
            }

            log.info("图生图任务保存成功: id={}, task_id={}", task.getId(), taskId);

            // 启动轮询服务（如果未运行）
            imageTaskPollingService.startPolling();

            Map<String, Object> data = new HashMap<>();
            data.put("id", task.getId());
            data.put("taskId", taskId);
            data.put("status", task.getStatus());
            data.put("createdAt", task.getCreatedAt());

            return Result.success(data, "任务创建成功");

        } catch (Exception e) {
            log.error("创建任务失败: {}", e.getMessage(), e);
            // 异常时释放并发槽位
            concurrencyLimitService.releaseImageSlot(userId);
            return Result.error("创建任务失败: " + e.getMessage(), 500);
        }
    }

    @GetMapping("/task/{id}")
    @Operation(summary = "查询任务状态")
    public Result<?> getTask(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            ImageGenerationTask task = imageGenerationTaskMapper.selectById(id);

            if (task == null) {
                return Result.error("任务不存在", 404);
            }

            if (!task.getUserId().equals(userId)) {
                return Result.error("无权访问此任务", 403);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("id", task.getId());
            data.put("taskId", task.getTaskId());
            data.put("type", task.getType());
            data.put("model", task.getModel());
            data.put("prompt", task.getPrompt());
            data.put("imageUrls", task.getImageUrls());
            data.put("aspectRatio", task.getAspectRatio());
            data.put("imageSize", task.getImageSize());
            data.put("status", task.getStatus());
            data.put("resultUrl", task.getResultUrl());
            data.put("errorMessage", task.getErrorMessage());
            data.put("createdAt", task.getCreatedAt());
            data.put("updatedAt", task.getUpdatedAt());
            data.put("completedAt", task.getCompletedAt());

            return Result.success(data);

        } catch (Exception e) {
            log.error("查询失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    @GetMapping("/tasks")
    @Operation(summary = "获取任务列表")
    public Result<?> getTasks(@Valid TaskQueryRequest request) {
        request.validateAndCorrect();

        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            LambdaQueryWrapper<ImageGenerationTask> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(ImageGenerationTask::getUserId, userId);

            if (StrUtil.isNotBlank(request.getStatus())) {
                queryWrapper.eq(ImageGenerationTask::getStatus, request.getStatus());
            }

            if (StrUtil.isNotBlank(request.getType())) {
                queryWrapper.eq(ImageGenerationTask::getType, request.getType());
            }

            queryWrapper.orderByDesc(ImageGenerationTask::getCreatedAt);

            Page<ImageGenerationTask> pageParam = new Page<>(request.getPage(), request.getPageSize());
            IPage<ImageGenerationTask> pageResult = imageGenerationTaskMapper.selectPage(pageParam, queryWrapper);

            return Result.success(PageResult.of(pageResult));

        } catch (Exception e) {
            log.error("查询失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    @DeleteMapping("/task/{id}")
    @Operation(summary = "删除任务")
    public Result<?> deleteTask(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            ImageGenerationTask task = imageGenerationTaskMapper.selectById(id);

            if (task == null) {
                return Result.error("任务不存在", 404);
            }

            if (!task.getUserId().equals(userId)) {
                return Result.error("无权删除此任务", 403);
            }

            imageGenerationTaskMapper.deleteById(id);

            return Result.success(null, "删除成功");

        } catch (Exception e) {
            log.error("删除失败: {}", e.getMessage(), e);
            return Result.error("删除失败: " + e.getMessage(), 500);
        }
    }
}
