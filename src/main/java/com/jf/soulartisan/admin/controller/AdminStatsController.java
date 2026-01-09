package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.dto.response.ContentStatisticsResponse;
import com.jf.soulartisan.admin.dto.response.UserStatisticsResponse;
import com.jf.soulartisan.admin.service.AdminStatsService;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 数据统计控制器
 */
@Tag(name = "数据统计", description = "增强的数据统计与分析接口")
@RestController
@RequestMapping("/admin/stats")
@SaAdminCheckLogin
public class AdminStatsController {

    @Autowired
    private AdminStatsService adminStatsService;

    /**
     * 获取用户统计数据
     */
    @Operation(summary = "获取用户统计数据", description = "获取详细的用户统计信息，包括增长趋势和分布")
    @GetMapping("/user")
    public Result<UserStatisticsResponse> getUserStats() {
        UserStatisticsResponse stats = adminStatsService.getUserStats();
        return Result.success(stats);
    }

    /**
     * 获取内容统计数据
     */
    @Operation(summary = "获取内容统计数据", description = "获取任务、项目、角色的详细统计信息和分析")
    @GetMapping("/content")
    public Result<ContentStatisticsResponse> getContentStats() {
        ContentStatisticsResponse stats = adminStatsService.getContentStats();
        return Result.success(stats);
    }
}
