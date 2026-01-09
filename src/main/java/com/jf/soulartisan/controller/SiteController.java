package com.jf.soulartisan.controller;

import com.jf.soulartisan.common.dto.SitePublicConfigResponse;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.service.SiteConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

/**
 * 站点配置接口（用户端公开接口，无需登录）
 */
@Slf4j
@RestController
@RequestMapping("/site")
@Tag(name = "站点配置接口")
public class SiteController {

    @Resource
    private SiteConfigService siteConfigService;

    @GetMapping("/config")
    @Operation(summary = "获取站点公开配置（通过域名）")
    public Result<SitePublicConfigResponse> getConfigByDomain(
            @Parameter(description = "站点域名") @RequestParam String domain) {
        SitePublicConfigResponse config = siteConfigService.getPublicConfigByDomain(domain);
        return Result.success(config);
    }

    @GetMapping("/config/code/{siteCode}")
    @Operation(summary = "获取站点公开配置（通过站点编码）")
    public Result<SitePublicConfigResponse> getConfigBySiteCode(
            @Parameter(description = "站点编码") @PathVariable String siteCode) {
        SitePublicConfigResponse config = siteConfigService.getPublicConfigBySiteCode(siteCode);
        return Result.success(config);
    }

    @GetMapping("/config/id/{siteId}")
    @Operation(summary = "获取站点公开配置（通过站点ID）")
    public Result<SitePublicConfigResponse> getConfigBySiteId(
            @Parameter(description = "站点ID") @PathVariable Long siteId) {
        SitePublicConfigResponse config = siteConfigService.getPublicConfigBySiteId(siteId);
        return Result.success(config);
    }
}
