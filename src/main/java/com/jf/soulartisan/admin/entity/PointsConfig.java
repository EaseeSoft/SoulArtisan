package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

import static com.jf.soulartisan.admin.entity.PointsConfig.ConfigKey.VIDEO_10S;

/**
 * 积分配置表（全局配置，由系统管理员设置）
 */
@Data
@TableName("points_config")
public class PointsConfig implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 配置键
     */
    private String configKey;

    /**
     * 消耗积分值
     */
    private Integer configValue;

    /**
     * 配置名称
     */
    private String configName;

    /**
     * 描述
     */
    private String description;

    /**
     * 是否启用: 0-禁用 1-启用
     */
    private Integer isEnabled;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 根据视频时长获取对应的配置键
     */
    public static String getVideoConfigKey(Integer duration) {
        if (duration == null) {
            return VIDEO_10S;
        }
        return switch (duration) {
            case 15 -> ConfigKey.VIDEO_15S;
            case 25 -> ConfigKey.VIDEO_25S;
            default -> VIDEO_10S;
        };
    }

    /**
     * 获取默认配置列表（用于初始化）
     */
    public static PointsConfig[] getDefaultConfigs() {
        return new PointsConfig[]{
                createConfig(ConfigKey.IMAGE_GENERATION, 10, "生成图片", "每次生成图片消耗的积分"),
                createConfig(VIDEO_10S, 50, "生成10秒视频", "生成10秒视频消耗的积分"),
                createConfig(ConfigKey.VIDEO_15S, 80, "生成15秒视频", "生成15秒视频消耗的积分"),
                createConfig(ConfigKey.VIDEO_25S, 150, "生成25秒视频", "生成25秒视频消耗的积分"),
                createConfig(ConfigKey.GEMINI_CHAT, 5, "AI对话(每次)", "每次AI对话消耗的积分")
        };
    }

    private static PointsConfig createConfig(String key, int value, String name, String desc) {
        PointsConfig config = new PointsConfig();
        config.setConfigKey(key);
        config.setConfigValue(value);
        config.setConfigName(name);
        config.setDescription(desc);
        config.setIsEnabled(EnableStatus.ENABLED);
        return config;
    }

    /**
     * 配置键常量
     */
    public static class ConfigKey {
        /**
         * 生成图片
         */
        public static final String IMAGE_GENERATION = "image_generation";
        /**
         * 生成10秒视频
         */
        public static final String VIDEO_10S = "video_10s";
        /**
         * 生成15秒视频
         */
        public static final String VIDEO_15S = "video_15s";
        /**
         * 生成25秒视频
         */
        public static final String VIDEO_25S = "video_25s";
        /**
         * AI对话(每次)
         */
        public static final String GEMINI_CHAT = "gemini_chat";
    }

    /**
     * 启用状态常量
     */
    public static class EnableStatus {
        public static final int DISABLED = 0;
        public static final int ENABLED = 1;
    }
}
