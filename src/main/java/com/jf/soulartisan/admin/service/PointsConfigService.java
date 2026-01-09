package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.admin.entity.PointsConfig;
import com.jf.soulartisan.admin.mapper.PointsConfigMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 积分配置服务（全局配置）
 */
@Slf4j
@Service
public class PointsConfigService {

    @Autowired
    private PointsConfigMapper pointsConfigMapper;

    /**
     * 获取所有积分配置
     *
     * @return 积分配置列表
     */
    public List<PointsConfig> getConfigList() {
        // 先检查是否有配置，没有则初始化
        ensureConfigsExist();

        LambdaQueryWrapper<PointsConfig> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.orderByAsc(PointsConfig::getId);
        return pointsConfigMapper.selectList(queryWrapper);
    }

    /**
     * 获取积分配置（Map形式，key为configKey）
     *
     * @return 积分配置Map
     */
    public Map<String, PointsConfig> getConfigMap() {
        List<PointsConfig> configs = getConfigList();
        Map<String, PointsConfig> configMap = new HashMap<>();
        for (PointsConfig config : configs) {
            configMap.put(config.getConfigKey(), config);
        }
        return configMap;
    }

    /**
     * 获取指定配置的积分值
     *
     * @param configKey 配置键
     * @return 积分值，如果配置不存在或禁用则返回0
     */
    public Integer getConfigValue(String configKey) {
        PointsConfig config = getConfig(configKey);
        if (config == null || config.getIsEnabled() != PointsConfig.EnableStatus.ENABLED) {
            return 0;
        }
        return config.getConfigValue();
    }

    /**
     * 获取指定配置
     *
     * @param configKey 配置键
     * @return 积分配置
     */
    public PointsConfig getConfig(String configKey) {
        // 先确保配置存在
        ensureConfigsExist();

        LambdaQueryWrapper<PointsConfig> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(PointsConfig::getConfigKey, configKey);
        return pointsConfigMapper.selectOne(queryWrapper);
    }

    /**
     * 检查指定功能是否启用
     *
     * @param configKey 配置键
     * @return 是否启用
     */
    public boolean isEnabled(String configKey) {
        PointsConfig config = getConfig(configKey);
        return config != null && config.getIsEnabled() == PointsConfig.EnableStatus.ENABLED;
    }

    /**
     * 更新积分配置
     *
     * @param configs 配置列表
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateConfigs(List<PointsConfig> configs) {
        for (PointsConfig config : configs) {
            if (config.getId() != null) {
                PointsConfig existingConfig = pointsConfigMapper.selectById(config.getId());
                if (existingConfig != null) {
                    // 只更新允许修改的字段
                    existingConfig.setConfigValue(config.getConfigValue());
                    existingConfig.setIsEnabled(config.getIsEnabled());
                    pointsConfigMapper.updateById(existingConfig);
                    log.info("更新积分配置: configKey={}, value={}, enabled={}",
                            existingConfig.getConfigKey(), config.getConfigValue(), config.getIsEnabled());
                }
            }
        }
    }

    /**
     * 更新单个配置
     *
     * @param configKey   配置键
     * @param configValue 积分值
     * @param isEnabled   是否启用
     */
    public void updateConfig(String configKey, Integer configValue, Integer isEnabled) {
        PointsConfig config = getConfig(configKey);
        if (config != null) {
            if (configValue != null) {
                config.setConfigValue(configValue);
            }
            if (isEnabled != null) {
                config.setIsEnabled(isEnabled);
            }
            pointsConfigMapper.updateById(config);
            log.info("更新积分配置: configKey={}, value={}, enabled={}",
                    configKey, configValue, isEnabled);
        }
    }

    /**
     * 确保积分配置存在，如果不存在则初始化
     * 同时检查是否有缺失的配置并补充
     */
    @Transactional(rollbackFor = Exception.class)
    public void ensureConfigsExist() {
        Long count = pointsConfigMapper.selectCount(null);

        if (count == 0) {
            log.info("积分配置不存在，开始初始化默认配置");
            initDefaultConfigs();
        } else {
            // 检查是否有缺失的配置，如果有则补充
            PointsConfig[] defaultConfigs = PointsConfig.getDefaultConfigs();
            if (count < defaultConfigs.length) {
                log.info("发现积分配置不完整，开始补充缺失配置");
                initDefaultConfigs();
            }
        }
    }

    /**
     * 初始化默认积分配置
     */
    @Transactional(rollbackFor = Exception.class)
    public void initDefaultConfigs() {
        PointsConfig[] defaultConfigs = PointsConfig.getDefaultConfigs();
        for (PointsConfig config : defaultConfigs) {
            // 检查是否已存在
            LambdaQueryWrapper<PointsConfig> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(PointsConfig::getConfigKey, config.getConfigKey());
            PointsConfig existing = pointsConfigMapper.selectOne(queryWrapper);

            if (existing == null) {
                pointsConfigMapper.insert(config);
                log.info("初始化积分配置: configKey={}, value={}",
                        config.getConfigKey(), config.getConfigValue());
            }
        }
    }
}
