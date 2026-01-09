package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.admin.dto.request.SiteConfigRequest;
import com.jf.soulartisan.admin.dto.request.SiteCreateRequest;
import com.jf.soulartisan.admin.dto.request.SiteUpdateRequest;
import com.jf.soulartisan.admin.dto.response.SiteConfigResponse;
import com.jf.soulartisan.admin.dto.response.SiteCreateResponse;
import com.jf.soulartisan.admin.dto.response.SiteDetailResponse;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.entity.Site;
import com.jf.soulartisan.admin.entity.SiteConfig;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.admin.mapper.SiteConfigMapper;
import com.jf.soulartisan.admin.mapper.SiteMapper;
import com.jf.soulartisan.admin.util.EncryptUtil;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.util.BeanUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 站点管理服务
 */
@Slf4j
@Service
public class AdminSiteService {

    @Autowired
    private SiteMapper siteMapper;

    @Autowired
    private AdminUserMapper adminUserMapper;

    @Autowired
    private SiteConfigMapper siteConfigMapper;

    @Autowired
    private EncryptUtil encryptUtil;

    /**
     * 创建站点（同时创建站点管理员）
     *
     * @param request 创建请求
     * @return 创建响应
     */
    @Transactional(rollbackFor = Exception.class)
    public SiteCreateResponse createSite(SiteCreateRequest request) {
        // 1. 检查站点编码是否重复
        Site existingSite = siteMapper.selectBySiteCode(request.getSiteCode());
        if (existingSite != null) {
            throw new ServiceException("站点编码已存在");
        }

        // 2. 检查管理员账号是否重复
        AdminUser existingAdmin = adminUserMapper.selectByUsername(request.getAdminUsername());
        if (existingAdmin != null) {
            throw new ServiceException("管理员账号已存在");
        }

        // 3. 创建站点
        Site site = new Site();
        site.setSiteName(request.getSiteName());
        site.setSiteCode(request.getSiteCode());
        site.setDomain(request.getDomain());
        site.setLogo(request.getLogo());
        site.setDescription(request.getDescription());
        site.setAdminUsername(request.getAdminUsername());
        site.setStatus(Site.Status.ENABLED);
        site.setSort(request.getSort() != null ? request.getSort() : 0);
        // createdBy 由 MyMetaObjectHandler 自动填充

        siteMapper.insert(site);

        // 4. 创建站点管理员
        AdminUser admin = new AdminUser();
        admin.setUsername(request.getAdminUsername());
        admin.setPassword(SecurityUtils.encryptPassword(request.getAdminPassword()));
        admin.setRealName(request.getAdminRealName());
        admin.setRole(AdminUser.Role.SITE_ADMIN);
        admin.setSiteId(site.getId());  // 绑定站点（确保1:1关系）
        admin.setStatus(AdminUser.Status.ENABLED);
        // createdBy 由 MyMetaObjectHandler 自动填充

        adminUserMapper.insert(admin);

        // 5. 返回结果
        SiteCreateResponse response = new SiteCreateResponse();
        response.setSiteId(site.getId());
        response.setSiteName(site.getSiteName());
        response.setSiteCode(site.getSiteCode());
        response.setAdminId(admin.getId());
        response.setAdminUsername(admin.getUsername());

        log.info("创建站点成功: siteId={}, siteName={}, adminId={}, adminUsername={}",
                site.getId(), site.getSiteName(), admin.getId(), admin.getUsername());

        return response;
    }

    /**
     * 删除站点（同时删除站点管理员和配置）
     *
     * @param siteId 站点ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteSite(Long siteId) {
        // 1. 检查站点是否存在
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        // 2. 检查站点下是否还有用户
        Long userCount = siteMapper.countUsersBySiteId(siteId);
        if (userCount > 0) {
            throw new ServiceException("站点下还有 " + userCount + " 个用户，无法删除");
        }

        // 3. 删除站点管理员
        adminUserMapper.deleteBySiteId(siteId);

        // 4. 删除站点配置
        siteConfigMapper.deleteBySiteId(siteId);

        // 5. 删除站点
        siteMapper.deleteById(siteId);

        log.info("删除站点成功: siteId={}, siteName={}", siteId, site.getSiteName());
    }

    /**
     * 更新站点基本信息
     *
     * @param siteId  站点ID
     * @param request 更新请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateSite(Long siteId, SiteUpdateRequest request) {
        // 检查站点是否存在
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        // 更新站点信息
        site.setSiteName(request.getSiteName());
        site.setDomain(request.getDomain());
        site.setLogo(request.getLogo());
        site.setDescription(request.getDescription());
        site.setSort(request.getSort() != null ? request.getSort() : site.getSort());
        // updatedBy 由 MyMetaObjectHandler 自动填充

        siteMapper.updateById(site);

        log.info("更新站点成功: siteId={}, siteName={}", siteId, site.getSiteName());
    }

    /**
     * 获取站点列表（分页）
     *
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @return 站点列表
     */
    public PageResult<SiteDetailResponse> getSiteList(Integer pageNum, Integer pageSize) {
        Page<Site> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<Site> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.orderByAsc(Site::getSort)
                .orderByDesc(Site::getCreatedAt);

        Page<Site> sitePage = siteMapper.selectPage(page, queryWrapper);

        // 转换为响应对象
        List<SiteDetailResponse> responseList = BeanUtils.toBean(sitePage.getRecords(), SiteDetailResponse.class);

        // 填充额外信息
        for (int i = 0; i < responseList.size(); i++) {
            SiteDetailResponse response = responseList.get(i);
            Site site = sitePage.getRecords().get(i);

            // 获取站点管理员信息
            AdminUser admin = adminUserMapper.selectBySiteId(site.getId());
            if (admin != null) {
                response.setAdminId(admin.getId());
                response.setAdminRealName(admin.getRealName());
            }

            // 获取用户数量
            Long userCount = siteMapper.countUsersBySiteId(site.getId());
            response.setUserCount(userCount);

            // 项目数量（如果需要可以添加）
            response.setProjectCount(0L);
        }

        PageResult<SiteDetailResponse> pageResult = new PageResult<>();
        pageResult.setList(responseList);
        pageResult.setTotal(sitePage.getTotal());
        pageResult.setPage(pageNum);
        pageResult.setPageSize(pageSize);

        return pageResult;
    }

    /**
     * 获取站点详情
     *
     * @param siteId 站点ID
     * @return 站点详情
     */
    public SiteDetailResponse getSiteDetail(Long siteId) {
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        SiteDetailResponse response = BeanUtils.toBean(site, SiteDetailResponse.class);

        // 获取站点管理员信息
        AdminUser admin = adminUserMapper.selectBySiteId(siteId);
        if (admin != null) {
            response.setAdminId(admin.getId());
            response.setAdminRealName(admin.getRealName());
        }

        // 获取用户数量
        Long userCount = siteMapper.countUsersBySiteId(siteId);
        response.setUserCount(userCount);

        // 项目数量（如果需要可以添加）
        response.setProjectCount(0L);

        return response;
    }

    /**
     * 修改站点状态
     *
     * @param siteId 站点ID
     * @param status 状态
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateSiteStatus(Long siteId, Integer status) {
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        site.setStatus(status);
        // updatedBy 由 MyMetaObjectHandler 自动填充
        siteMapper.updateById(site);

        // 同时更新站点管理员状态
        AdminUser admin = adminUserMapper.selectBySiteId(siteId);
        if (admin != null) {
            admin.setStatus(status);
            // updatedBy 由 MyMetaObjectHandler 自动填充
            adminUserMapper.updateById(admin);
        }

        log.info("修改站点状态成功: siteId={}, status={}", siteId, status);
    }

    /**
     * 重置站点管理员密码
     *
     * @param siteId      站点ID
     * @param newPassword 新密码
     */
    @Transactional(rollbackFor = Exception.class)
    public void resetAdminPassword(Long siteId, String newPassword) {
        // 检查站点是否存在
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        // 获取站点管理员
        AdminUser admin = adminUserMapper.selectBySiteId(siteId);
        if (admin == null) {
            throw new ServiceException("站点管理员不存在");
        }

        // 更新密码
        admin.setPassword(SecurityUtils.encryptPassword(newPassword));
        // updatedBy 由 MyMetaObjectHandler 自动填充
        adminUserMapper.updateById(admin);

        log.info("重置站点管理员密码成功: siteId={}, adminId={}", siteId, admin.getId());
    }

    /**
     * 保存站点配置（敏感信息加密存储）
     *
     * @param siteId  站点ID
     * @param request 配置请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void saveConfig(Long siteId, SiteConfigRequest request) {
        // 检查站点是否存在
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        // ===== API 配置 =====
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.DUOMI_API_KEY, request.getDuomiApiKey(),
                SiteConfig.ConfigType.API_KEY, "多米API Key", true);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.DUOMI_API_URL, request.getDuomiApiUrl(),
                SiteConfig.ConfigType.API_KEY, "多米API请求地址", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.GEMINI_API_KEY, request.getGeminiApiKey(),
                SiteConfig.ConfigType.API_KEY, "Gemini API Key", true);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.GEMINI_API_URL, request.getGeminiApiUrl(),
                SiteConfig.ConfigType.API_KEY, "Gemini API 请求地址", false);

        // ===== COS 配置 =====
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.COS_SECRET_ID, request.getCosSecretId(),
                SiteConfig.ConfigType.COS, "腾讯云COS Secret ID", true);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.COS_SECRET_KEY, request.getCosSecretKey(),
                SiteConfig.ConfigType.COS, "腾讯云COS Secret Key", true);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.COS_BUCKET, request.getCosBucket(),
                SiteConfig.ConfigType.COS, "腾讯云COS存储桶", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.COS_REGION, request.getCosRegion(),
                SiteConfig.ConfigType.COS, "腾讯云COS区域", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.COS_CDN_DOMAIN, request.getCosCdnDomain(),
                SiteConfig.ConfigType.COS, "腾讯云COS CDN域名", false);

        // ===== 回调地址配置 =====
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.VIDEO_CALLBACK_URL, request.getVideoCallbackUrl(),
                SiteConfig.ConfigType.SYSTEM, "视频生成回调地址", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.CHARACTER_CALLBACK_URL, request.getCharacterCallbackUrl(),
                SiteConfig.ConfigType.SYSTEM, "角色生成回调地址", false);

        // ===== 系统配置 =====
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.MAX_USERS,
                request.getMaxUsers() != null ? request.getMaxUsers().toString() : null,
                SiteConfig.ConfigType.SYSTEM, "最大用户数", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.MAX_STORAGE,
                request.getMaxStorage() != null ? request.getMaxStorage().toString() : null,
                SiteConfig.ConfigType.SYSTEM, "最大存储空间", false);

        // ===== 站点展示配置 =====
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.DISPLAY_NAME, request.getDisplayName(),
                SiteConfig.ConfigType.DISPLAY, "站点显示名称", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.FAVICON, request.getFavicon(),
                SiteConfig.ConfigType.DISPLAY, "网站图标", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.THEME_COLOR, request.getThemeColor(),
                SiteConfig.ConfigType.DISPLAY, "主题色", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.FOOTER_TEXT, request.getFooterText(),
                SiteConfig.ConfigType.DISPLAY, "页脚文字", false);
        saveOrUpdateConfigItem(siteId, SiteConfig.ConfigKey.COPYRIGHT, request.getCopyright(),
                SiteConfig.ConfigType.DISPLAY, "版权信息", false);

        log.info("保存站点配置成功: siteId={}", siteId);
    }

    /**
     * 获取站点配置（脱敏显示）- 系统管理员使用，返回完整配置
     *
     * @param siteId 站点ID
     * @return 配置响应
     */
    public SiteConfigResponse getConfigForDisplay(Long siteId) {
        // 检查站点是否存在
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        // 查询所有配置
        List<SiteConfig> configList = siteConfigMapper.selectBySiteId(siteId);
        Map<String, SiteConfig> configMap = new HashMap<>();
        for (SiteConfig config : configList) {
            configMap.put(config.getConfigKey(), config);
        }

        // 构建响应对象（脱敏显示）
        SiteConfigResponse response = new SiteConfigResponse();
        response.setSiteId(siteId);

        // ===== API 配置（脱敏） =====
        response.setDuomiApiKey(getMaskedConfigValue(configMap, SiteConfig.ConfigKey.DUOMI_API_KEY));
        response.setDuomiApiUrl(getConfigValue(configMap, SiteConfig.ConfigKey.DUOMI_API_URL, false));
        response.setGeminiApiKey(getMaskedConfigValue(configMap, SiteConfig.ConfigKey.GEMINI_API_KEY));
        response.setGeminiApiUrl(getConfigValue(configMap, SiteConfig.ConfigKey.GEMINI_API_URL, false));

        // ===== COS 配置（脱敏） =====
        response.setCosSecretId(getMaskedConfigValue(configMap, SiteConfig.ConfigKey.COS_SECRET_ID));
        response.setCosSecretKey(getMaskedConfigValue(configMap, SiteConfig.ConfigKey.COS_SECRET_KEY));
        response.setCosBucket(getConfigValue(configMap, SiteConfig.ConfigKey.COS_BUCKET, false));
        response.setCosRegion(getConfigValue(configMap, SiteConfig.ConfigKey.COS_REGION, false));
        response.setCosCdnDomain(getConfigValue(configMap, SiteConfig.ConfigKey.COS_CDN_DOMAIN, false));

        // ===== 回调地址配置 =====
        response.setVideoCallbackUrl(getConfigValue(configMap, SiteConfig.ConfigKey.VIDEO_CALLBACK_URL, false));
        response.setCharacterCallbackUrl(getConfigValue(configMap, SiteConfig.ConfigKey.CHARACTER_CALLBACK_URL, false));

        // ===== 系统配置 =====
        String maxUsers = getConfigValue(configMap, SiteConfig.ConfigKey.MAX_USERS, false);
        response.setMaxUsers(StringUtils.hasText(maxUsers) ? Integer.parseInt(maxUsers) : null);

        String maxStorage = getConfigValue(configMap, SiteConfig.ConfigKey.MAX_STORAGE, false);
        response.setMaxStorage(StringUtils.hasText(maxStorage) ? Long.parseLong(maxStorage) : null);

        // ===== 站点展示配置 =====
        response.setDisplayName(getConfigValue(configMap, SiteConfig.ConfigKey.DISPLAY_NAME, false));
        response.setFavicon(getConfigValue(configMap, SiteConfig.ConfigKey.FAVICON, false));
        response.setThemeColor(getConfigValue(configMap, SiteConfig.ConfigKey.THEME_COLOR, false));
        response.setFooterText(getConfigValue(configMap, SiteConfig.ConfigKey.FOOTER_TEXT, false));
        response.setCopyright(getConfigValue(configMap, SiteConfig.ConfigKey.COPYRIGHT, false));

        return response;
    }

    /**
     * 获取站点配置（站点管理员使用）- 不返回 API 相关配置
     *
     * @param siteId 站点ID
     * @return 配置响应（不包含API配置）
     */
    public SiteConfigResponse getConfigForSiteAdmin(Long siteId) {
        // 检查站点是否存在
        Site site = siteMapper.selectById(siteId);
        if (site == null) {
            throw new ServiceException("站点不存在");
        }

        // 查询所有配置
        List<SiteConfig> configList = siteConfigMapper.selectBySiteId(siteId);
        Map<String, SiteConfig> configMap = new HashMap<>();
        for (SiteConfig config : configList) {
            configMap.put(config.getConfigKey(), config);
        }

        // 构建响应对象（站点管理员视角：不包含API配置）
        SiteConfigResponse response = new SiteConfigResponse();
        response.setSiteId(siteId);

        // ===== 不返回 API 配置 =====
        // response.setDuomiApiKey / setDuomiApiUrl / setGeminiApiKey / setGeminiApiUrl 保持为 null

        // ===== COS 配置（脱敏） =====
        response.setCosSecretId(getMaskedConfigValue(configMap, SiteConfig.ConfigKey.COS_SECRET_ID));
        response.setCosSecretKey(getMaskedConfigValue(configMap, SiteConfig.ConfigKey.COS_SECRET_KEY));
        response.setCosBucket(getConfigValue(configMap, SiteConfig.ConfigKey.COS_BUCKET, false));
        response.setCosRegion(getConfigValue(configMap, SiteConfig.ConfigKey.COS_REGION, false));
        response.setCosCdnDomain(getConfigValue(configMap, SiteConfig.ConfigKey.COS_CDN_DOMAIN, false));

        // ===== 不返回回调地址配置 =====
        // response.setVideoCallbackUrl / setCharacterCallbackUrl 保持为 null

        // ===== 不返回系统配置 =====
        // response.setMaxUsers / setMaxStorage 保持为 null

        // ===== 站点展示配置 =====
        response.setDisplayName(getConfigValue(configMap, SiteConfig.ConfigKey.DISPLAY_NAME, false));
        response.setFavicon(getConfigValue(configMap, SiteConfig.ConfigKey.FAVICON, false));
        response.setThemeColor(getConfigValue(configMap, SiteConfig.ConfigKey.THEME_COLOR, false));
        response.setFooterText(getConfigValue(configMap, SiteConfig.ConfigKey.FOOTER_TEXT, false));
        response.setCopyright(getConfigValue(configMap, SiteConfig.ConfigKey.COPYRIGHT, false));

        return response;
    }

    /**
     * 获取站点配置（完整值，解密后）- 仅供内部使用
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
                value = encryptUtil.decrypt(value);
            }
            configMap.put(config.getConfigKey(), value);
        }

        return configMap;
    }

    /**
     * 保存或更新单个配置项
     *
     * @param siteId      站点ID
     * @param configKey   配置键
     * @param configValue 配置值
     * @param configType  配置类型
     * @param description 配置描述
     * @param needEncrypt 是否需要加密
     */
    private void saveOrUpdateConfigItem(Long siteId, String configKey, String configValue,
                                        String configType, String description, boolean needEncrypt) {
        if (!StringUtils.hasText(configValue)) {
            return; // 空值不保存
        }

        // 如果是加密字段且值包含脱敏标记(***)，跳过保存（避免把脱敏值当作新值保存）
        if (needEncrypt && configValue.contains("***")) {
            log.debug("配置项 {} 的值为脱敏格式，跳过保存", configKey);
            return;
        }

        // 查询是否已存在
        SiteConfig existingConfig = siteConfigMapper.selectBySiteIdAndKey(siteId, configKey);

        // 加密处理
        String valueToSave = configValue;
        if (needEncrypt) {
            valueToSave = encryptUtil.encrypt(configValue);
        }

        if (existingConfig != null) {
            // 更新
            existingConfig.setConfigValue(valueToSave);
            existingConfig.setIsEncrypted(needEncrypt ? 1 : 0);
            // updatedBy 由 MyMetaObjectHandler 自动填充
            siteConfigMapper.updateById(existingConfig);
        } else {
            // 新增
            SiteConfig newConfig = new SiteConfig();
            newConfig.setSiteId(siteId);
            newConfig.setConfigKey(configKey);
            newConfig.setConfigValue(valueToSave);
            newConfig.setConfigType(configType);
            newConfig.setDescription(description);
            newConfig.setIsEncrypted(needEncrypt ? 1 : 0);
            // createdBy 由 MyMetaObjectHandler 自动填充
            siteConfigMapper.insert(newConfig);
        }
    }

    /**
     * 获取配置值（脱敏）
     *
     * @param configMap 配置Map
     * @param configKey 配置键
     * @return 脱敏后的值
     */
    private String getMaskedConfigValue(Map<String, SiteConfig> configMap, String configKey) {
        SiteConfig config = configMap.get(configKey);
        if (config == null || !StringUtils.hasText(config.getConfigValue())) {
            return null;
        }

        String value = config.getConfigValue();
        // 如果是加密字段，先解密再脱敏
        if (Integer.valueOf(1).equals(config.getIsEncrypted())) {
            value = encryptUtil.decrypt(value);
        }
        return encryptUtil.maskForDisplay(value);
    }

    /**
     * 获取配置值
     *
     * @param configMap   配置Map
     * @param configKey   配置键
     * @param needDecrypt 是否需要解密
     * @return 配置值
     */
    private String getConfigValue(Map<String, SiteConfig> configMap, String configKey, boolean needDecrypt) {
        SiteConfig config = configMap.get(configKey);
        if (config == null || !StringUtils.hasText(config.getConfigValue())) {
            return null;
        }

        String value = config.getConfigValue();
        // 如果需要解密
        if (needDecrypt && Integer.valueOf(1).equals(config.getIsEncrypted())) {
            value = encryptUtil.decrypt(value);
        }
        return value;
    }
}
