package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.dto.request.UserCreateRequest;
import com.jf.soulartisan.admin.dto.request.UserQueryRequest;
import com.jf.soulartisan.admin.dto.request.UserUpdateRequest;
import com.jf.soulartisan.admin.dto.response.UserDetailResponse;
import com.jf.soulartisan.admin.dto.response.UserStatsResponse;
import com.jf.soulartisan.admin.service.AdminUserService;
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
 * 用户管理控制器
 */
@Tag(name = "用户管理", description = "管理平台用户的接口")
@RestController
@RequestMapping("/admin/user")
@SaAdminCheckLogin
public class AdminUserController {

    @Autowired
    private AdminUserService adminUserService;

    /**
     * 获取用户列表
     */
    @Operation(summary = "获取用户列表", description = "分页获取用户列表，站点管理员只能查看自己站点的用户")
    @GetMapping("/list")
    public Result<PageResult<UserDetailResponse>> getUserList(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize,
            @Valid UserQueryRequest request) {
        PageResult<UserDetailResponse> pageResult = adminUserService.getUserList(pageNum, pageSize, request);
        return Result.success(pageResult);
    }

    /**
     * 获取用户详情
     */
    @Operation(summary = "获取用户详情", description = "获取单个用户的详细信息")
    @GetMapping("/{userId}")
    public Result<UserDetailResponse> getUserDetail(
            @Parameter(description = "用户ID") @PathVariable Long userId) {
        UserDetailResponse response = adminUserService.getUserDetail(userId);
        return Result.success(response);
    }

    /**
     * 创建用户（仅站点管理员可用）
     */
    @Operation(summary = "创建用户", description = "站点管理员创建用户，同站点下用户名不能重复")
    @AdminLog(module = "用户管理", operation = "创建用户")
    @PostMapping
    public Result<Void> createUser(@Valid @RequestBody UserCreateRequest request) {
        adminUserService.createUser(request);
        return Result.success(null);
    }

    /**
     * 更新用户信息
     */
    @Operation(summary = "更新用户信息", description = "更新用户的基本信息")
    @AdminLog(module = "用户管理", operation = "更新用户信息")
    @PutMapping("/{userId}")
    public Result<Void> updateUser(
            @Parameter(description = "用户ID") @PathVariable Long userId,
            @Valid @RequestBody UserUpdateRequest request) {
        adminUserService.updateUser(userId, request);
        return Result.success(null);
    }

    /**
     * 修改用户状态
     */
    @Operation(summary = "修改用户状态", description = "封禁或解封用户")
    @AdminLog(module = "用户管理", operation = "修改用户状态")
    @PutMapping("/{userId}/status")
    public Result<Void> updateUserStatus(
            @Parameter(description = "用户ID") @PathVariable Long userId,
            @Parameter(description = "状态：0-禁用，1-启用") @RequestParam Integer status) {
        adminUserService.updateUserStatus(userId, status);
        return Result.success(null);
    }

    /**
     * 删除用户
     */
    @Operation(summary = "删除用户", description = "删除指定用户")
    @AdminLog(module = "用户管理", operation = "删除用户")
    @DeleteMapping("/{userId}")
    public Result<Void> deleteUser(
            @Parameter(description = "用户ID") @PathVariable Long userId) {
        adminUserService.deleteUser(userId);
        return Result.success(null);
    }

    /**
     * 重置用户密码
     */
    @Operation(summary = "重置用户密码", description = "管理员重置用户密码")
    @AdminLog(module = "用户管理", operation = "重置用户密码")
    @PutMapping("/{userId}/password")
    public Result<Void> resetUserPassword(
            @Parameter(description = "用户ID") @PathVariable Long userId,
            @Parameter(description = "新密码") @RequestParam String newPassword) {
        adminUserService.resetUserPassword(userId, newPassword);
        return Result.success(null);
    }

    /**
     * 获取用户统计数据
     */
    @Operation(summary = "获取用户统计数据", description = "获取用户相关的统计数据")
    @GetMapping("/stats")
    public Result<UserStatsResponse> getUserStats() {
        UserStatsResponse stats = adminUserService.getUserStats();
        return Result.success(stats);
    }
}
