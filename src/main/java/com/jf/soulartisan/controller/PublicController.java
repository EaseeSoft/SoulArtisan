package com.jf.soulartisan.controller;

import com.jf.soulartisan.admin.dto.response.SystemConfigResponse;
import com.jf.soulartisan.admin.service.SystemConfigService;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 公开接口控制器（无需登录）
 */
@Tag(name = "公开接口", description = "无需登录即可访问的公开接口")
@RestController
@RequestMapping("/public")
public class PublicController {

    @Autowired
    private SystemConfigService systemConfigService;

    /**
     * 获取系统配置（公开）
     */
    @Operation(summary = "获取系统配置", description = "获取系统全局配置信息，用于前端显示（无需登录）")
    @GetMapping("/system/config")
    public Result<SystemConfigResponse> getSystemConfig() {
        SystemConfigResponse response = systemConfigService.getPublicConfig();
        return Result.success(response);
    }
}
