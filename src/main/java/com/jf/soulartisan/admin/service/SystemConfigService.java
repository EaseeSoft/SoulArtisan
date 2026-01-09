package com.jf.soulartisan.admin.service;

import com.jf.soulartisan.admin.dto.request.SystemConfigRequest;
import com.jf.soulartisan.admin.dto.response.SystemConfigResponse;
import com.jf.soulartisan.admin.entity.SystemConfig;
import com.jf.soulartisan.admin.mapper.SystemConfigMapper;
import com.jf.soulartisan.common.util.BeanUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 系统配置服务
 */
@Slf4j
@Service
public class SystemConfigService {

    /**
     * 默认系统标题
     */
    private static final String DEFAULT_SYSTEM_TITLE = "易企漫剧平台";
    /**
     * 默认版权信息
     */
    private static final String DEFAULT_COPYRIGHT = "© 2025 易企漫剧平台";
    /**
     * 默认登录页标题
     */
    private static final String DEFAULT_LOGIN_TITLE = "易企漫剧平台";
    /**
     * 默认登录页副标题
     */
    private static final String DEFAULT_LOGIN_SUBTITLE = "登录以继续使用系统";
    /**
     * 默认主题色
     */
    private static final String DEFAULT_PRIMARY_COLOR = "#6366f1";
    /**
     * 默认图片并发限制
     */
    private static final Integer DEFAULT_IMAGE_CONCURRENCY_LIMIT = 10;
    /**
     * 默认视频并发限制
     */
    private static final Integer DEFAULT_VIDEO_CONCURRENCY_LIMIT = 5;
    @Autowired
    private SystemConfigMapper systemConfigMapper;

    /**
     * 获取系统配置
     *
     * @return 系统配置响应
     */
    public SystemConfigResponse getConfig() {
        SystemConfig config = getOrCreateConfig();
        return toResponse(config);
    }

    /**
     * 获取公开的系统配置（无需登录）
     *
     * @return 系统配置响应
     */
    public SystemConfigResponse getPublicConfig() {
        SystemConfig config = getOrCreateConfig();
        return toResponse(config);
    }

    /**
     * 更新系统配置
     *
     * @param request 配置请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateConfig(SystemConfigRequest request) {
        SystemConfig config = getOrCreateConfig();

        // 更新配置项（只更新非空值）
        if (StringUtils.hasText(request.getSystemTitle())) {
            config.setSystemTitle(request.getSystemTitle());
        }
        if (request.getSystemLogo() != null) {
            config.setSystemLogo(request.getSystemLogo());
        }
        if (request.getSystemFavicon() != null) {
            config.setSystemFavicon(request.getSystemFavicon());
        }
        if (request.getCopyright() != null) {
            config.setCopyright(request.getCopyright());
        }
        if (request.getFooterText() != null) {
            config.setFooterText(request.getFooterText());
        }
        if (request.getIcpBeian() != null) {
            config.setIcpBeian(request.getIcpBeian());
        }
        if (request.getLoginBgImage() != null) {
            config.setLoginBgImage(request.getLoginBgImage());
        }
        if (request.getLoginTitle() != null) {
            config.setLoginTitle(request.getLoginTitle());
        }
        if (request.getLoginSubtitle() != null) {
            config.setLoginSubtitle(request.getLoginSubtitle());
        }
        if (request.getPrimaryColor() != null) {
            config.setPrimaryColor(request.getPrimaryColor());
        }
        if (request.getImageConcurrencyLimit() != null) {
            config.setImageConcurrencyLimit(request.getImageConcurrencyLimit());
        }
        if (request.getVideoConcurrencyLimit() != null) {
            config.setVideoConcurrencyLimit(request.getVideoConcurrencyLimit());
        }

        systemConfigMapper.updateById(config);
        log.info("系统配置已更新");
    }

    /**
     * 获取或创建配置（确保始终有一条配置记录）
     *
     * @return 系统配置
     */
    private SystemConfig getOrCreateConfig() {
        // 获取第一条配置记录
        SystemConfig config = systemConfigMapper.selectById(1L);

        if (config == null) {
            // 如果不存在，创建默认配置
            config = new SystemConfig();
            config.setSystemTitle(DEFAULT_SYSTEM_TITLE);
            config.setCopyright(DEFAULT_COPYRIGHT);
            config.setLoginTitle(DEFAULT_LOGIN_TITLE);
            config.setLoginSubtitle(DEFAULT_LOGIN_SUBTITLE);
            config.setPrimaryColor(DEFAULT_PRIMARY_COLOR);
            config.setImageConcurrencyLimit(DEFAULT_IMAGE_CONCURRENCY_LIMIT);
            config.setVideoConcurrencyLimit(DEFAULT_VIDEO_CONCURRENCY_LIMIT);
            systemConfigMapper.insert(config);
            log.info("已创建默认系统配置");
        }

        return config;
    }

    /**
     * 转换为响应对象
     *
     * @param config 配置实体
     * @return 响应对象
     */
    private SystemConfigResponse toResponse(SystemConfig config) {
        SystemConfigResponse response = BeanUtils.toBean(config, SystemConfigResponse.class);

        // 设置默认值
        if (!StringUtils.hasText(response.getSystemTitle())) {
            response.setSystemTitle(DEFAULT_SYSTEM_TITLE);
        }
        if (!StringUtils.hasText(response.getCopyright())) {
            response.setCopyright(DEFAULT_COPYRIGHT);
        }
        if (!StringUtils.hasText(response.getLoginTitle())) {
            response.setLoginTitle(DEFAULT_LOGIN_TITLE);
        }
        if (!StringUtils.hasText(response.getLoginSubtitle())) {
            response.setLoginSubtitle(DEFAULT_LOGIN_SUBTITLE);
        }
        if (!StringUtils.hasText(response.getPrimaryColor())) {
            response.setPrimaryColor(DEFAULT_PRIMARY_COLOR);
        }
        if (response.getImageConcurrencyLimit() == null) {
            response.setImageConcurrencyLimit(DEFAULT_IMAGE_CONCURRENCY_LIMIT);
        }
        if (response.getVideoConcurrencyLimit() == null) {
            response.setVideoConcurrencyLimit(DEFAULT_VIDEO_CONCURRENCY_LIMIT);
        }

        return response;
    }
}
