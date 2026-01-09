package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 站点详情响应
 */
@Data
@Schema(description = "站点详情响应")
public class SiteDetailResponse {

    @Schema(description = "站点ID")
    private Long id;

    @Schema(description = "站点名称")
    private String siteName;

    @Schema(description = "站点编码（唯一标识）")
    private String siteCode;

    @Schema(description = "站点域名")
    private String domain;

    @Schema(description = "Logo URL")
    private String logo;

    @Schema(description = "站点描述")
    private String description;

    @Schema(description = "站点管理员账号")
    private String adminUsername;

    @Schema(description = "站点管理员ID")
    private Long adminId;

    @Schema(description = "站点管理员姓名")
    private String adminRealName;

    @Schema(description = "状态: 0-禁用 1-启用")
    private Integer status;

    @Schema(description = "排序")
    private Integer sort;

    @Schema(description = "用户数量")
    private Long userCount;

    @Schema(description = "项目数量")
    private Long projectCount;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;
}
