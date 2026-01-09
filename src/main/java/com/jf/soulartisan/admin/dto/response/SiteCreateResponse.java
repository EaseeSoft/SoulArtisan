package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 创建站点响应
 */
@Data
@Schema(description = "创建站点响应")
public class SiteCreateResponse {

    @Schema(description = "站点ID")
    private Long siteId;

    @Schema(description = "站点名称")
    private String siteName;

    @Schema(description = "站点编码")
    private String siteCode;

    @Schema(description = "站点管理员ID")
    private Long adminId;

    @Schema(description = "站点管理员账号")
    private String adminUsername;
}
