package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.dto.request.SiteConfigRequest;
import com.jf.soulartisan.admin.dto.response.SiteConfigResponse;
import com.jf.soulartisan.admin.dto.response.SiteDetailResponse;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.admin.service.AdminSiteService;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 站点管理员配置控制器
 * 站点管理员可以配置自己所属站点的信息
 */
@Tag(name = "站点管理员配置", description = "站点管理员配置自己站点的接口")
@RestController
@RequestMapping("/admin/my-site")
@SaAdminCheckLogin
public class SiteAdminConfigController {

    @Autowired
    private AdminSiteService adminSiteService;

    @Autowired
    private AdminUserMapper adminUserMapper;

    /**
     * 获取当前管理员的站点ID
     */
    private Long getCurrentSiteId() {
        Long adminId = StpKit.ADMIN.getLoginIdAsLong();
        AdminUser adminUser = adminUserMapper.selectById(adminId);
        if (adminUser == null) {
            throw new ServiceException("管理员信息不存在");
        }
        if (adminUser.getSiteId() == null) {
            throw new ServiceException("系统管理员没有所属站点");
        }
        return adminUser.getSiteId();
    }

    /**
     * 获取当前站点详情
     */
    @Operation(summary = "获取当前站点详情", description = "站点管理员获取自己所属站点的详细信息")
    @GetMapping("/detail")
    public Result<SiteDetailResponse> getMySiteDetail() {
        Long siteId = getCurrentSiteId();
        SiteDetailResponse response = adminSiteService.getSiteDetail(siteId);
        return Result.success(response);
    }

    /**
     * 获取当前站点配置
     */
    @Operation(summary = "获取当前站点配置", description = "站点管理员获取自己所属站点的配置信息（不包含API配置，敏感信息脱敏显示）")
    @GetMapping("/config")
    public Result<SiteConfigResponse> getMySiteConfig() {
        Long siteId = getCurrentSiteId();
        SiteConfigResponse response = adminSiteService.getConfigForSiteAdmin(siteId);
        return Result.success(response);
    }

    /**
     * 更新当前站点配置
     */
    @Operation(summary = "更新当前站点配置", description = "站点管理员更新自己所属站点的配置信息")
    @AdminLog(module = "站点配置", operation = "更新站点配置")
    @PutMapping("/config")
    public Result<Void> updateMySiteConfig(@Valid @RequestBody SiteConfigRequest request) {
        Long siteId = getCurrentSiteId();
        adminSiteService.saveConfig(siteId, request);
        return Result.success(null);
    }
}
