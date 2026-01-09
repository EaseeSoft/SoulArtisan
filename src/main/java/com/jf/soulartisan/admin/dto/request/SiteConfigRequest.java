package com.jf.soulartisan.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 站点配置请求
 */
@Data
@Schema(description = "站点配置请求")
public class SiteConfigRequest {

    // ===== API 配置 =====
    @Schema(description = "多米API Key")
    private String duomiApiKey;

    @Schema(description = "多米API请求地址")
    private String duomiApiUrl;

    @Schema(description = "Gemini API Key")
    private String geminiApiKey;

    @Schema(description = "Gemini API 请求地址")
    private String geminiApiUrl;

    // ===== 腾讯云 COS 配置 =====
    @Schema(description = "腾讯云COS Secret ID")
    private String cosSecretId;

    @Schema(description = "腾讯云COS Secret Key")
    private String cosSecretKey;

    @Schema(description = "腾讯云COS存储桶名称")
    private String cosBucket;

    @Schema(description = "腾讯云COS区域")
    private String cosRegion;

    @Schema(description = "腾讯云COS CDN域名")
    private String cosCdnDomain;

    // ===== 回调地址配置 =====
    @Schema(description = "视频生成回调地址")
    private String videoCallbackUrl;

    @Schema(description = "角色生成回调地址")
    private String characterCallbackUrl;

    // ===== 系统配置 =====
    @Schema(description = "最大用户数")
    private Integer maxUsers;

    @Schema(description = "最大存储空间(MB)")
    private Long maxStorage;

    // ===== 站点展示配置 =====
    @Schema(description = "站点显示名称（用户看到的名称）")
    private String displayName;

    @Schema(description = "网站图标URL")
    private String favicon;

    @Schema(description = "主题色")
    private String themeColor;

    @Schema(description = "页脚文字")
    private String footerText;

    @Schema(description = "版权信息")
    private String copyright;
}
