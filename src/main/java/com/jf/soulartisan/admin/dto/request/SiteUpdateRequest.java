package com.jf.soulartisan.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 更新站点请求参数
 */
@Data
@Schema(description = "更新站点请求参数")
public class SiteUpdateRequest {

    @NotBlank(message = "站点名称不能为空")
    @Size(max = 100, message = "站点名称不能超过100个字符")
    @Schema(description = "站点名称", example = "测试站点", requiredMode = Schema.RequiredMode.REQUIRED)
    private String siteName;

    @Schema(description = "站点域名", example = "https://test.example.com")
    private String domain;

    @Schema(description = "站点Logo URL", example = "https://cos.xxx/logo.png")
    private String logo;

    @Size(max = 500, message = "站点描述不能超过500个字符")
    @Schema(description = "站点描述", example = "这是一个测试站点")
    private String description;

    @Schema(description = "排序", example = "0")
    private Integer sort;
}
