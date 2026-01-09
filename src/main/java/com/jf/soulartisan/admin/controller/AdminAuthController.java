package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.dto.request.AdminLoginRequest;
import com.jf.soulartisan.admin.dto.request.UpdatePasswordRequest;
import com.jf.soulartisan.admin.dto.response.AdminInfoResponse;
import com.jf.soulartisan.admin.dto.response.AdminLoginResponse;
import com.jf.soulartisan.admin.service.AdminAuthService;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 管理员认证控制器
 */
@Tag(name = "管理员认证", description = "管理员登录、登出、信息获取等接口")
@RestController
@RequestMapping("/admin/auth")
public class AdminAuthController {

    @Autowired
    private AdminAuthService adminAuthService;

    /**
     * 管理员登录
     */
    @Operation(summary = "管理员登录", description = "系统管理员和站点管理员使用相同的登录接口")
    @PostMapping("/login")
    public Result<AdminLoginResponse> login(@Valid @RequestBody AdminLoginRequest request) {
        AdminLoginResponse response = adminAuthService.login(request);
        return Result.success(response);
    }

    /**
     * 管理员登出
     */
    @Operation(summary = "管理员登出")
    @SaAdminCheckLogin
    @PostMapping("/logout")
    public Result<Void> logout() {
        adminAuthService.logout();
        return Result.success(null);
    }

    /**
     * 获取当前管理员信息
     */
    @Operation(summary = "获取当前管理员信息")
    @SaAdminCheckLogin
    @GetMapping("/info")
    public Result<AdminInfoResponse> getCurrentAdminInfo() {
        AdminInfoResponse response = adminAuthService.getCurrentAdminInfo();
        return Result.success(response);
    }

    /**
     * 修改密码
     */
    @Operation(summary = "修改密码")
    @SaAdminCheckLogin
    @PutMapping("/password")
    public Result<Void> updatePassword(@Valid @RequestBody UpdatePasswordRequest request) {
        adminAuthService.updatePassword(request);
        return Result.success(null);
    }
}
