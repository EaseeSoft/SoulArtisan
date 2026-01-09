package com.jf.soulartisan.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 系统配置请求
 */
@Data
@Schema(description = "系统配置请求")
public class SystemConfigRequest {

    @Schema(description = "系统标题")
    private String systemTitle;

    @Schema(description = "系统Logo URL")
    private String systemLogo;

    @Schema(description = "系统Favicon URL")
    private String systemFavicon;

    @Schema(description = "版权信息")
    private String copyright;

    @Schema(description = "页脚文字")
    private String footerText;

    @Schema(description = "ICP备案号")
    private String icpBeian;

    @Schema(description = "登录页背景图URL")
    private String loginBgImage;

    @Schema(description = "登录页标题")
    private String loginTitle;

    @Schema(description = "登录页副标题")
    private String loginSubtitle;

    @Schema(description = "主题色")
    private String primaryColor;

    @Schema(description = "图片生成并发任务数限制（0表示不限制）")
    private Integer imageConcurrencyLimit;

    @Schema(description = "视频生成并发任务数限制（0表示不限制）")
    private Integer videoConcurrencyLimit;
}
