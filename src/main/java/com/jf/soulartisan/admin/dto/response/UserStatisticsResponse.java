package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 用户统计响应
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "用户统计数据")
public class UserStatisticsResponse {

    @Schema(description = "用户总数")
    private Integer totalUsers;

    @Schema(description = "启用用户数")
    private Integer activeUsers;

    @Schema(description = "禁用用户数")
    private Integer inactiveUsers;

    @Schema(description = "今日新增用户")
    private Integer todayNewUsers;

    @Schema(description = "本周新增用户")
    private Integer weekNewUsers;

    @Schema(description = "本月新增用户")
    private Integer monthNewUsers;

    @Schema(description = "用户增长趋势（最近30天）")
    private List<TrendData> userGrowthTrend;

    @Schema(description = "按站点分布")
    private List<SiteDistribution> userDistributionBySite;

    /**
     * 趋势数据
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrendData {
        @Schema(description = "日期")
        private String date;

        @Schema(description = "数量")
        private Integer count;
    }

    /**
     * 站点分布
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SiteDistribution {
        @Schema(description = "站点ID")
        private Long siteId;

        @Schema(description = "站点名称")
        private String siteName;

        @Schema(description = "用户数量")
        private Integer userCount;
    }
}
