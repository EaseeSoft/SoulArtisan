package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.annotation.RequireSystemAdmin;
import com.jf.soulartisan.admin.dto.request.SystemConfigRequest;
import com.jf.soulartisan.admin.dto.response.SystemConfigResponse;
import com.jf.soulartisan.admin.service.SystemConfigService;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 系统配置控制器（管理员接口）
 */
@Tag(name = "系统配置管理", description = "系统全局配置接口，仅系统管理员可访问")
@RestController
@RequestMapping("/admin/system/config")
@SaAdminCheckLogin
@RequireSystemAdmin
public class AdminSystemConfigController {

    @Autowired
    private SystemConfigService systemConfigService;

    /**
     * 获取系统配置
     */
    @Operation(summary = "获取系统配置", description = "获取系统全局配置信息")
    @GetMapping
    public Result<SystemConfigResponse> getConfig() {
        SystemConfigResponse response = systemConfigService.getConfig();
        return Result.success(response);
    }

    /**
     * 更新系统配置
     */
    @Operation(summary = "更新系统配置", description = "更新系统全局配置（标题、Logo、版权等）")
    @AdminLog(module = "系统配置", operation = "更新系统配置")
    @PutMapping
    public Result<Void> updateConfig(@Valid @RequestBody SystemConfigRequest request) {
        systemConfigService.updateConfig(request);
        return Result.success(null);
    }
}
