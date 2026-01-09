package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jf.soulartisan.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 站点配置表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("site_config")
public class SiteConfig extends BaseEntity {

    /**
     * 站点ID
     */
    private Long siteId;

    /**
     * 配置键
     */
    private String configKey;

    /**
     * 配置值(敏感信息加密存储)
     */
    private String configValue;

    /**
     * 配置类型: api_key/cos/system
     */
    private String configType;

    /**
     * 配置描述
     */
    private String description;

    /**
     * 是否加密: 0-否 1-是
     */
    private Integer isEncrypted;

    /**
     * 配置类型常量
     */
    public static class ConfigType {
        public static final String API_KEY = "api_key";
        public static final String COS = "cos";
        public static final String SYSTEM = "system";
        public static final String DISPLAY = "display";
    }

    /**
     * 配置键常量
     */
    public static class ConfigKey {
        // API 配置
        public static final String GEMINI_API_KEY = "gemini_api_key";
        public static final String GEMINI_API_URL = "gemini_api_url";
        public static final String DUOMI_API_KEY = "duomi_api_key";
        public static final String DUOMI_API_URL = "duomi_api_url";

        // COS 配置
        public static final String COS_SECRET_ID = "cos_secret_id";
        public static final String COS_SECRET_KEY = "cos_secret_key";
        public static final String COS_BUCKET = "cos_bucket";
        public static final String COS_REGION = "cos_region";
        public static final String COS_CDN_DOMAIN = "cos_cdn_domain";

        // 回调地址配置
        public static final String VIDEO_CALLBACK_URL = "video_callback_url";
        public static final String CHARACTER_CALLBACK_URL = "character_callback_url";

        // 系统配置
        public static final String MAX_USERS = "max_users";
        public static final String MAX_STORAGE = "max_storage";

        // 站点展示配置
        public static final String DISPLAY_NAME = "display_name";
        public static final String FAVICON = "favicon";
        public static final String THEME_COLOR = "theme_color";
        public static final String FOOTER_TEXT = "footer_text";
        public static final String COPYRIGHT = "copyright";
    }
}
