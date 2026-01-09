package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.dto.request.TaskQueryRequest;
import com.jf.soulartisan.admin.dto.response.ImageTaskDetailResponse;
import com.jf.soulartisan.admin.dto.response.TaskStatsResponse;
import com.jf.soulartisan.admin.dto.response.VideoTaskDetailResponse;
import com.jf.soulartisan.admin.service.AdminTaskService;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 任务管理控制器
 */
@Tag(name = "任务管理", description = "管理图片和视频生成任务的接口")
@RestController
@RequestMapping("/admin/task")
@SaAdminCheckLogin
public class AdminTaskController {

    @Autowired
    private AdminTaskService adminTaskService;

    /**
     * 获取图片任务列表
     */
    @Operation(summary = "获取图片任务列表", description = "分页获取图片生成任务列表，站点管理员只能查看自己站点的任务")
    @GetMapping("/image/list")
    public Result<PageResult<ImageTaskDetailResponse>> getImageTaskList(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize,
            @Valid TaskQueryRequest request) {
        PageResult<ImageTaskDetailResponse> pageResult = adminTaskService.getImageTaskList(pageNum, pageSize, request);
        return Result.success(pageResult);
    }

    /**
     * 获取视频任务列表
     */
    @Operation(summary = "获取视频任务列表", description = "分页获取视频生成任务列表，站点管理员只能查看自己站点的任务")
    @GetMapping("/video/list")
    public Result<PageResult<VideoTaskDetailResponse>> getVideoTaskList(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize,
            @Valid TaskQueryRequest request) {
        PageResult<VideoTaskDetailResponse> pageResult = adminTaskService.getVideoTaskList(pageNum, pageSize, request);
        return Result.success(pageResult);
    }

    /**
     * 获取图片任务详情
     */
    @Operation(summary = "获取图片任务详情", description = "获取单个图片任务的详细信息")
    @GetMapping("/image/{taskId}")
    public Result<ImageTaskDetailResponse> getImageTaskDetail(
            @Parameter(description = "任务ID") @PathVariable Long taskId) {
        ImageTaskDetailResponse response = adminTaskService.getImageTaskDetail(taskId);
        return Result.success(response);
    }

    /**
     * 获取视频任务详情
     */
    @Operation(summary = "获取视频任务详情", description = "获取单个视频任务的详细信息")
    @GetMapping("/video/{taskId}")
    public Result<VideoTaskDetailResponse> getVideoTaskDetail(
            @Parameter(description = "任务ID") @PathVariable Long taskId) {
        VideoTaskDetailResponse response = adminTaskService.getVideoTaskDetail(taskId);
        return Result.success(response);
    }

    /**
     * 添加图片任务备注
     */
    @Operation(summary = "添加图片任务备注", description = "管理员为图片任务添加备注")
    @AdminLog(module = "任务管理", operation = "添加图片任务备注")
    @PutMapping("/image/{taskId}/remark")
    public Result<Void> addImageTaskRemark(
            @Parameter(description = "任务ID") @PathVariable Long taskId,
            @Parameter(description = "备注内容") @RequestParam String remark) {
        adminTaskService.addTaskRemark(taskId, remark, true);
        return Result.success(null);
    }

    /**
     * 添加视频任务备注
     */
    @Operation(summary = "添加视频任务备注", description = "管理员为视频任务添加备注")
    @AdminLog(module = "任务管理", operation = "添加视频任务备注")
    @PutMapping("/video/{taskId}/remark")
    public Result<Void> addVideoTaskRemark(
            @Parameter(description = "任务ID") @PathVariable Long taskId,
            @Parameter(description = "备注内容") @RequestParam String remark) {
        adminTaskService.addTaskRemark(taskId, remark, false);
        return Result.success(null);
    }

    /**
     * 获取任务统计数据
     */
    @Operation(summary = "获取任务统计数据", description = "获取图片和视频任务的统计数据")
    @GetMapping("/stats")
    public Result<TaskStatsResponse> getTaskStats() {
        TaskStatsResponse stats = adminTaskService.getTaskStats();
        return Result.success(stats);
    }
}
