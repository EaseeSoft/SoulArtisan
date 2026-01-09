package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.annotation.RequireSystemAdmin;
import com.jf.soulartisan.admin.entity.PointsConfig;
import com.jf.soulartisan.admin.service.PointsConfigService;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 积分配置控制器（全局配置）
 * 仅系统管理员可以配置各功能消耗的积分
 */
@Tag(name = "积分配置", description = "积分扣除配置接口（系统管理员）")
@RestController
@RequestMapping("/admin/points/config")
@SaAdminCheckLogin
@RequireSystemAdmin
public class AdminPointsConfigController {

    @Autowired
    private PointsConfigService pointsConfigService;

    /**
     * 获取积分配置列表
     */
    @Operation(summary = "获取积分配置列表", description = "获取所有积分配置")
    @GetMapping("/list")
    public Result<List<PointsConfig>> getConfigList() {
        List<PointsConfig> configs = pointsConfigService.getConfigList();
        return Result.success(configs);
    }

    /**
     * 更新积分配置
     */
    @Operation(summary = "更新积分配置", description = "批量更新积分配置")
    @AdminLog(module = "积分配置", operation = "更新积分配置")
    @PutMapping("/update")
    public Result<Void> updateConfigs(@Valid @RequestBody List<PointsConfig> configs) {
        pointsConfigService.updateConfigs(configs);
        return Result.success(null, "配置更新成功");
    }

    /**
     * 更新单个积分配置
     */
    @Operation(summary = "更新单个积分配置", description = "更新指定的积分配置")
    @AdminLog(module = "积分配置", operation = "更新单个积分配置")
    @PutMapping("/update/{configKey}")
    public Result<Void> updateConfig(
            @PathVariable String configKey,
            @RequestParam(required = false) Integer configValue,
            @RequestParam(required = false) Integer isEnabled) {
        pointsConfigService.updateConfig(configKey, configValue, isEnabled);
        return Result.success(null, "配置更新成功");
    }

    /**
     * 初始化积分配置
     * 如果没有配置，会自动初始化默认配置
     */
    @Operation(summary = "初始化积分配置", description = "初始化默认积分配置")
    @AdminLog(module = "积分配置", operation = "初始化积分配置")
    @PostMapping("/init")
    public Result<List<PointsConfig>> initConfigs() {
        pointsConfigService.initDefaultConfigs();
        List<PointsConfig> configs = pointsConfigService.getConfigList();
        return Result.success(configs, "配置初始化成功");
    }
}
