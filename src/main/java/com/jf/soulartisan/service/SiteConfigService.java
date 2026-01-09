package com.jf.soulartisan.service;

import com.jf.soulartisan.admin.entity.Site;
import com.jf.soulartisan.admin.entity.SiteConfig;
import com.jf.soulartisan.admin.mapper.SiteConfigMapper;
import com.jf.soulartisan.admin.mapper.SiteMapper;
import com.jf.soulartisan.common.dto.SitePublicConfigResponse;
import com.jf.soulartisan.common.exception.ServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 站点配置服务（用户端）
 */
@Slf4j
@Service
public class SiteConfigService {

    @Autowired
    private SiteMapper siteMapper;

    @Autowired
    private SiteConfigMapper siteConfigMapper;

    /**
     * 根据域名获取站点公开配置
     *
     * @param domain 域名
     * @return 公开配置
     */
    public SitePublicConfigResponse getPublicConfigByDomain(String domain) {
        Site site = siteMapper.selectByDomain(domain);
        if (site == null) {
            throw new ServiceException("站点不存在或已禁用");
        }

        return buildPublicConfig(site);
    }

    /**
     * 根据站点编码获取站点公开配置
     *
     * @param siteCode 站点编码
     * @return 公开配置
     */
    public SitePublicConfigResponse getPublicConfigBySiteCode(String siteCode) {
        Site site = siteMapper.selectBySiteCode(siteCode);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        if (site.getStatus() != Site.Status.ENABLED) {
            throw new ServiceException("站点已禁用");
        }

        return buildPublicConfig(site);
    }

    /**
     * 根据站点ID获取站点公开配置
     *
     * @param siteId 站点ID
     * @return 公开配置
     */
    public SitePublicConfigResponse getPublicConfigBySiteId(Long siteId) {
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        if (site.getStatus() != Site.Status.ENABLED) {
            throw new ServiceException("站点已禁用");
        }

        return buildPublicConfig(site);
    }

    /**
     * 构建公开配置响应
     *
     * @param site 站点信息
     * @return 公开配置
     */
    private SitePublicConfigResponse buildPublicConfig(Site site) {
        // 查询站点配置
        List<SiteConfig> configList = siteConfigMapper.selectBySiteId(site.getId());
        Map<String, String> configMap = new HashMap<>();
        for (SiteConfig config : configList) {
            // 只获取展示类配置，不处理加密字段
            if (config.getIsEncrypted() == 0) {
                configMap.put(config.getConfigKey(), config.getConfigValue());
            }
        }

        // 构建响应
        SitePublicConfigResponse response = new SitePublicConfigResponse();
        response.setSiteId(site.getId());
        response.setSiteCode(site.getSiteCode());
        response.setSiteName(site.getSiteName());
        response.setDomain(site.getDomain());
        response.setLogo(site.getLogo());
        response.setDescription(site.getDescription());

        // 展示配置（优先使用配置，否则使用站点基本信息）
        String displayName = configMap.get(SiteConfig.ConfigKey.DISPLAY_NAME);
        response.setDisplayName(StringUtils.hasText(displayName) ? displayName : site.getSiteName());

        response.setFavicon(configMap.get(SiteConfig.ConfigKey.FAVICON));
        response.setThemeColor(configMap.get(SiteConfig.ConfigKey.THEME_COLOR));
        response.setFooterText(configMap.get(SiteConfig.ConfigKey.FOOTER_TEXT));
        response.setCopyright(configMap.get(SiteConfig.ConfigKey.COPYRIGHT));

        return response;
    }
}
