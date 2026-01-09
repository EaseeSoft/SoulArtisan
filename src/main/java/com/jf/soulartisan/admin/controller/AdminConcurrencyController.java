package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.entity.SystemConfig;
import com.jf.soulartisan.admin.service.ConcurrencyLimitService;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 管理后台 - 并发控制接口
 */
@RestController
@RequestMapping("/admin/concurrency")
@Tag(name = "并发控制管理")
@SaAdminCheckLogin
public class AdminConcurrencyController {

    @Resource
    private ConcurrencyLimitService concurrencyLimitService;

    @GetMapping("/config")
    @Operation(summary = "获取并发限制配置")
    public Result<?> getConfig() {
        SystemConfig config = concurrencyLimitService.getSystemConfig();

        Map<String, Object> result = new HashMap<>();
        result.put("imageConcurrencyLimit", config.getImageConcurrencyLimit() != null
                ? config.getImageConcurrencyLimit() : 10);
        result.put("videoConcurrencyLimit", config.getVideoConcurrencyLimit() != null
                ? config.getVideoConcurrencyLimit() : 5);

        return Result.success(result);
    }
}
