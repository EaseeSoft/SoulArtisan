package com.jf.soulartisan.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.admin.entity.SiteConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 站点配置表 Mapper
 */
@Mapper
public interface SiteConfigMapper extends BaseMapper<SiteConfig> {

    /**
     * 根据站点ID和配置键查询配置
     *
     * @param siteId    站点ID
     * @param configKey 配置键
     * @return 配置信息
     */
    SiteConfig selectBySiteIdAndKey(@Param("siteId") Long siteId, @Param("configKey") String configKey);

    /**
     * 根据站点ID查询所有配置
     *
     * @param siteId 站点ID
     * @return 配置列表
     */
    List<SiteConfig> selectBySiteId(@Param("siteId") Long siteId);

    /**
     * 根据站点ID删除所有配置
     *
     * @param siteId 站点ID
     * @return 删除数量
     */
    int deleteBySiteId(@Param("siteId") Long siteId);

    /**
     * 根据站点ID和配置类型查询配置列表
     *
     * @param siteId     站点ID
     * @param configType 配置类型
     * @return 配置列表
     */
    List<SiteConfig> selectBySiteIdAndType(@Param("siteId") Long siteId, @Param("configType") String configType);
}
