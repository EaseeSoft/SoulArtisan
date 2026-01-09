package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.dto.response.DashboardStatsResponse;
import com.jf.soulartisan.admin.dto.response.DashboardTrendResponse;
import com.jf.soulartisan.admin.service.AdminDashboardService;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Dashboard 控制器
 */
@Tag(name = "Dashboard", description = "Dashboard 数据统计接口")
@RestController
@RequestMapping("/admin/dashboard")
@SaAdminCheckLogin
public class AdminDashboardController {

    @Autowired
    private AdminDashboardService dashboardService;

    /**
     * 获取系统统计数据
     */
    @Operation(summary = "获取系统统计数据", description = "获取用户、任务、项目等统计数据，站点管理员只能看到自己站点的数据")
    @GetMapping("/stats")
    public Result<DashboardStatsResponse> getSystemStats() {
        DashboardStatsResponse stats = dashboardService.getSystemStats();
        return Result.success(stats);
    }

    /**
     * 获取趋势数据
     */
    @Operation(summary = "获取趋势数据", description = "获取用户增长、任务数量等趋势数据")
    @GetMapping("/trend")
    public Result<DashboardTrendResponse> getTrendData(
            @Parameter(description = "天数（7或30）") @RequestParam(defaultValue = "7") Integer days) {
        DashboardTrendResponse trend = dashboardService.getTrendData(days);
        return Result.success(trend);
    }
}
