package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.annotation.RequireSystemAdmin;
import com.jf.soulartisan.admin.dto.request.SiteConfigRequest;
import com.jf.soulartisan.admin.dto.request.SiteCreateRequest;
import com.jf.soulartisan.admin.dto.request.SiteUpdateRequest;
import com.jf.soulartisan.admin.dto.response.SiteConfigResponse;
import com.jf.soulartisan.admin.dto.response.SiteCreateResponse;
import com.jf.soulartisan.admin.dto.response.SiteDetailResponse;
import com.jf.soulartisan.admin.service.AdminSiteService;
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
 * 站点管理控制器
 */
@Tag(name = "站点管理", description = "站点的增删改查接口，仅系统管理员可访问")
@RestController
@RequestMapping("/admin/site")
@SaAdminCheckLogin
@RequireSystemAdmin
public class AdminSiteController {

    @Autowired
    private AdminSiteService adminSiteService;

    /**
     * 创建站点
     */
    @Operation(summary = "创建站点", description = "创建新站点并自动创建站点管理员账号")
    @AdminLog(module = "站点管理", operation = "创建站点")
    @PostMapping
    public Result<SiteCreateResponse> createSite(@Valid @RequestBody SiteCreateRequest request) {
        SiteCreateResponse response = adminSiteService.createSite(request);
        return Result.success(response);
    }

    /**
     * 删除站点
     */
    @Operation(summary = "删除站点", description = "删除站点及其管理员账号，如果站点下还有用户则无法删除")
    @AdminLog(module = "站点管理", operation = "删除站点")
    @DeleteMapping("/{siteId}")
    public Result<Void> deleteSite(
            @Parameter(description = "站点ID") @PathVariable Long siteId) {
        adminSiteService.deleteSite(siteId);
        return Result.success(null);
    }

    /**
     * 更新站点信息
     */
    @Operation(summary = "更新站点信息", description = "更新站点的基本信息")
    @AdminLog(module = "站点管理", operation = "更新站点信息")
    @PutMapping("/{siteId}")
    public Result<Void> updateSite(
            @Parameter(description = "站点ID") @PathVariable Long siteId,
            @Valid @RequestBody SiteUpdateRequest request) {
        adminSiteService.updateSite(siteId, request);
        return Result.success(null);
    }

    /**
     * 获取站点列表
     */
    @Operation(summary = "获取站点列表", description = "分页获取所有站点列表")
    @GetMapping("/list")
    public Result<PageResult<SiteDetailResponse>> getSiteList(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize) {
        PageResult<SiteDetailResponse> pageResult = adminSiteService.getSiteList(pageNum, pageSize);
        return Result.success(pageResult);
    }

    /**
     * 获取站点详情
     */
    @Operation(summary = "获取站点详情", description = "获取单个站点的详细信息")
    @GetMapping("/{siteId}")
    public Result<SiteDetailResponse> getSiteDetail(
            @Parameter(description = "站点ID") @PathVariable Long siteId) {
        SiteDetailResponse response = adminSiteService.getSiteDetail(siteId);
        return Result.success(response);
    }

    /**
     * 修改站点状态
     */
    @Operation(summary = "修改站点状态", description = "启用或禁用站点（同时修改站点管理员状态）")
    @AdminLog(module = "站点管理", operation = "修改站点状态")
    @PutMapping("/{siteId}/status")
    public Result<Void> updateSiteStatus(
            @Parameter(description = "站点ID") @PathVariable Long siteId,
            @Parameter(description = "状态：0-禁用，1-启用") @RequestParam Integer status) {
        adminSiteService.updateSiteStatus(siteId, status);
        return Result.success(null);
    }

    /**
     * 重置站点管理员密码
     */
    @Operation(summary = "重置站点管理员密码", description = "系统管理员重置站点管理员的密码")
    @AdminLog(module = "站点管理", operation = "重置站点管理员密码")
    @PutMapping("/{siteId}/admin/password")
    public Result<Void> resetAdminPassword(
            @Parameter(description = "站点ID") @PathVariable Long siteId,
            @Parameter(description = "新密码") @RequestParam String newPassword) {
        adminSiteService.resetAdminPassword(siteId, newPassword);
        return Result.success(null);
    }

    /**
     * 获取站点配置
     */
    @Operation(summary = "获取站点配置", description = "获取站点配置信息（敏感信息脱敏显示）")
    @GetMapping("/{siteId}/config")
    public Result<SiteConfigResponse> getSiteConfig(
            @Parameter(description = "站点ID") @PathVariable Long siteId) {
        SiteConfigResponse response = adminSiteService.getConfigForDisplay(siteId);
        return Result.success(response);
    }

    /**
     * 更新站点配置
     */
    @Operation(summary = "更新站点配置", description = "更新站点配置信息（API Key、COS配置等）")
    @AdminLog(module = "站点管理", operation = "更新站点配置")
    @PutMapping("/{siteId}/config")
    public Result<Void> updateSiteConfig(
            @Parameter(description = "站点ID") @PathVariable Long siteId,
            @Valid @RequestBody SiteConfigRequest request) {
        adminSiteService.saveConfig(siteId, request);
        return Result.success(null);
    }
}
