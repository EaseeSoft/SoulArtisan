package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.dto.request.LogQueryRequest;
import com.jf.soulartisan.admin.entity.AdminLoginLog;
import com.jf.soulartisan.admin.entity.AdminOperationLog;
import com.jf.soulartisan.admin.service.AdminLogService;
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
 * 日志管理控制器
 */
@Tag(name = "日志管理", description = "管理操作日志和登录日志的接口")
@RestController
@RequestMapping("/admin/log")
@SaAdminCheckLogin
public class AdminLogController {

    @Autowired
    private AdminLogService adminLogService;

    /**
     * 获取操作日志列表
     */
    @Operation(summary = "获取操作日志列表", description = "分页获取管理员操作日志，站点管理员只能查看自己站点的日志")
    @GetMapping("/operation/list")
    public Result<PageResult<AdminOperationLog>> getOperationLogs(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize,
            @Valid LogQueryRequest request) {
        PageResult<AdminOperationLog> pageResult = adminLogService.getOperationLogs(pageNum, pageSize, request);
        return Result.success(pageResult);
    }

    /**
     * 获取登录日志列表
     */
    @Operation(summary = "获取登录日志列表", description = "分页获取管理员登录日志，站点管理员只能查看自己的登录日志")
    @GetMapping("/login/list")
    public Result<PageResult<AdminLoginLog>> getLoginLogs(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize,
            @Valid LogQueryRequest request) {
        PageResult<AdminLoginLog> pageResult = adminLogService.getLoginLogs(pageNum, pageSize, request);
        return Result.success(pageResult);
    }

    /**
     * 获取操作日志详情
     */
    @Operation(summary = "获取操作日志详情", description = "获取单个操作日志的详细信息")
    @GetMapping("/operation/{logId}")
    public Result<AdminOperationLog> getOperationLogDetail(
            @Parameter(description = "日志ID") @PathVariable Long logId) {
        AdminOperationLog log = adminLogService.getOperationLogDetail(logId);
        return Result.success(log);
    }

    /**
     * 获取登录日志详情
     */
    @Operation(summary = "获取登录日志详情", description = "获取单个登录日志的详细信息")
    @GetMapping("/login/{logId}")
    public Result<AdminLoginLog> getLoginLogDetail(
            @Parameter(description = "日志ID") @PathVariable Long logId) {
        AdminLoginLog log = adminLogService.getLoginLogDetail(logId);
        return Result.success(log);
    }
}
