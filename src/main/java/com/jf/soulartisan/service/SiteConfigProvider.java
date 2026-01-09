package com.jf.soulartisan.service;

import com.jf.soulartisan.admin.entity.SiteConfig;
import com.jf.soulartisan.admin.mapper.SiteConfigMapper;
import com.jf.soulartisan.admin.util.EncryptUtil;
import com.jf.soulartisan.common.exception.ServiceException;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 站点配置提供者
 * 提供站点配置的读取和验证功能
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SiteConfigProvider {

    private final SiteConfigMapper siteConfigMapper;
    private final EncryptUtil encryptUtil;

    /**
     * 获取站点的所有配置（解密后）
     *
     * @param siteId 站点ID
     * @return 配置Map
     */
    public Map<String, String> getConfig(Long siteId) {
        List<SiteConfig> configList = siteConfigMapper.selectBySiteId(siteId);
        Map<String, String> configMap = new HashMap<>();

        for (SiteConfig config : configList) {
            String value = config.getConfigValue();
            // 如果是加密字段，则解密
            if (Integer.valueOf(1).equals(config.getIsEncrypted()) && StringUtils.hasText(value)) {
                try {
                    value = encryptUtil.decrypt(value);
                } catch (Exception e) {
                    log.error("配置项 {} 解密失败: {}", config.getConfigKey(), e.getMessage());
                }
            }
            configMap.put(config.getConfigKey(), value);
        }

        return configMap;
    }

    /**
     * 获取单个配置项（解密后）
     *
     * @param siteId    站点ID
     * @param configKey 配置键
     * @return 配置值
     */
    public String getConfigValue(Long siteId, String configKey) {
        SiteConfig config = siteConfigMapper.selectBySiteIdAndKey(siteId, configKey);
        if (config == null || !StringUtils.hasText(config.getConfigValue())) {
            return null;
        }

        String value = config.getConfigValue();
        // 检查是否需要解密（isEncrypted为1时解密）
        if (Integer.valueOf(1).equals(config.getIsEncrypted())) {
            try {
                value = encryptUtil.decrypt(value);
                log.debug("配置项 {} 已解密", configKey);
            } catch (Exception e) {
                log.error("配置项 {} 解密失败: {}", configKey, e.getMessage());
                // 解密失败时返回原值（可能是未加密的旧数据）
            }
        }
        return value;
    }

    /**
     * 获取必需的配置项，如果不存在则抛出异常
     *
     * @param siteId      站点ID
     * @param configKey   配置键
     * @param description 配置描述（用于错误提示）
     * @return 配置值
     */
    public String getRequiredConfig(Long siteId, String configKey, String description) {
        String value = getConfigValue(siteId, configKey);
        if (!StringUtils.hasText(value)) {
            throw new ServiceException("站点配置缺失: " + description + "，请在站点配置中设置");
        }
        return value;
    }

    /**
     * 获取多米API配置
     *
     * @param siteId 站点ID
     * @return 多米API配置
     */
    public DuomiApiConfig getDuomiApiConfig(Long siteId) {
        DuomiApiConfig config = new DuomiApiConfig();
        config.setApiUrl(getRequiredConfig(siteId, SiteConfig.ConfigKey.DUOMI_API_URL, "多米API地址"));
        config.setApiKey(getRequiredConfig(siteId, SiteConfig.ConfigKey.DUOMI_API_KEY, "多米API Key"));
        config.setVideoCallbackUrl(getConfigValue(siteId, SiteConfig.ConfigKey.VIDEO_CALLBACK_URL));
        config.setCharacterCallbackUrl(getConfigValue(siteId, SiteConfig.ConfigKey.CHARACTER_CALLBACK_URL));
        return config;
    }

    /**
     * 获取Gemini API配置
     *
     * @param siteId 站点ID
     * @return Gemini API配置
     */
    public GeminiApiConfig getGeminiApiConfig(Long siteId) {
        GeminiApiConfig config = new GeminiApiConfig();
        config.setApiUrl(getRequiredConfig(siteId, SiteConfig.ConfigKey.GEMINI_API_URL, "Gemini API地址"));
        config.setApiKey(getRequiredConfig(siteId, SiteConfig.ConfigKey.GEMINI_API_KEY, "Gemini API Key"));
        return config;
    }

    /**
     * 获取腾讯云COS配置
     *
     * @param siteId 站点ID
     * @return COS配置
     */
    public CosConfig getCosConfig(Long siteId) {
        CosConfig config = new CosConfig();
        config.setSecretId(getRequiredConfig(siteId, SiteConfig.ConfigKey.COS_SECRET_ID, "腾讯云COS Secret ID"));
        config.setSecretKey(getRequiredConfig(siteId, SiteConfig.ConfigKey.COS_SECRET_KEY, "腾讯云COS Secret Key"));
        config.setBucket(getRequiredConfig(siteId, SiteConfig.ConfigKey.COS_BUCKET, "腾讯云COS存储桶"));
        config.setRegion(getRequiredConfig(siteId, SiteConfig.ConfigKey.COS_REGION, "腾讯云COS区域"));
        config.setCdnDomain(getConfigValue(siteId, SiteConfig.ConfigKey.COS_CDN_DOMAIN));
        return config;
    }

    /**
     * 检查站点是否已配置多米API
     */
    public boolean hasDuomiApiConfig(Long siteId) {
        String apiUrl = getConfigValue(siteId, SiteConfig.ConfigKey.DUOMI_API_URL);
        String apiKey = getConfigValue(siteId, SiteConfig.ConfigKey.DUOMI_API_KEY);
        return StringUtils.hasText(apiUrl) && StringUtils.hasText(apiKey);
    }

    /**
     * 检查站点是否已配置Gemini API
     */
    public boolean hasGeminiApiConfig(Long siteId) {
        String apiUrl = getConfigValue(siteId, SiteConfig.ConfigKey.GEMINI_API_URL);
        String apiKey = getConfigValue(siteId, SiteConfig.ConfigKey.GEMINI_API_KEY);
        return StringUtils.hasText(apiUrl) && StringUtils.hasText(apiKey);
    }

    /**
     * 检查站点是否已配置腾讯云COS
     */
    public boolean hasCosConfig(Long siteId) {
        String secretId = getConfigValue(siteId, SiteConfig.ConfigKey.COS_SECRET_ID);
        String secretKey = getConfigValue(siteId, SiteConfig.ConfigKey.COS_SECRET_KEY);
        String bucket = getConfigValue(siteId, SiteConfig.ConfigKey.COS_BUCKET);
        String region = getConfigValue(siteId, SiteConfig.ConfigKey.COS_REGION);
        return StringUtils.hasText(secretId) && StringUtils.hasText(secretKey)
                && StringUtils.hasText(bucket) && StringUtils.hasText(region);
    }

    /**
     * 多米API配置
     */
    @Data
    public static class DuomiApiConfig {
        private String apiUrl;
        private String apiKey;
        private String videoCallbackUrl;
        private String characterCallbackUrl;
    }

    /**
     * Gemini API配置
     */
    @Data
    public static class GeminiApiConfig {
        private String apiUrl;
        private String apiKey;
    }

    /**
     * 腾讯云COS配置
     */
    @Data
    public static class CosConfig {
        private String secretId;
        private String secretKey;
        private String bucket;
        private String region;
        private String cdnDomain;

        /**
         * 获取基础URL
         */
        public String getBaseUrl() {
            if (StringUtils.hasText(cdnDomain)) {
                return cdnDomain.startsWith("http") ? cdnDomain : "https://" + cdnDomain;
            }
            return "https://" + bucket + ".cos." + region + ".myqcloud.com";
        }
    }
}
