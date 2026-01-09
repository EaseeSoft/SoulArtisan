package com.jf.soulartisan.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 创建站点请求参数
 */
@Data
@Schema(description = "创建站点请求参数")
public class SiteCreateRequest {

    @NotBlank(message = "站点名称不能为空")
    @Size(max = 100, message = "站点名称不能超过100个字符")
    @Schema(description = "站点名称", example = "测试站点", requiredMode = Schema.RequiredMode.REQUIRED)
    private String siteName;

    @NotBlank(message = "站点编码不能为空")
    @Pattern(regexp = "^[a-z0-9_]+$", message = "站点编码只能包含小写字母、数字和下划线")
    @Size(max = 50, message = "站点编码不能超过50个字符")
    @Schema(description = "站点编码（唯一标识，创建后不可修改）", example = "test_site", requiredMode = Schema.RequiredMode.REQUIRED)
    private String siteCode;

    @Schema(description = "站点域名", example = "https://test.example.com")
    private String domain;

    @Schema(description = "站点Logo URL", example = "https://cos.xxx/logo.png")
    private String logo;

    @Size(max = 500, message = "站点描述不能超过500个字符")
    @Schema(description = "站点描述", example = "这是一个测试站点")
    private String description;

    @NotBlank(message = "管理员账号不能为空")
    @Size(min = 4, max = 50, message = "管理员账号长度必须在4-50个字符之间")
    @Schema(description = "站点管理员账号", example = "test_admin", requiredMode = Schema.RequiredMode.REQUIRED)
    private String adminUsername;

    @NotBlank(message = "管理员密码不能为空")
    @Size(min = 6, max = 50, message = "管理员密码长度必须在6-50个字符之间")
    @Schema(description = "站点管理员密码", example = "123456", requiredMode = Schema.RequiredMode.REQUIRED)
    private String adminPassword;

    @Size(max = 50, message = "管理员姓名不能超过50个字符")
    @Schema(description = "管理员真实姓名", example = "测试管理员")
    private String adminRealName;

    @Schema(description = "排序", example = "0")
    private Integer sort;
}
