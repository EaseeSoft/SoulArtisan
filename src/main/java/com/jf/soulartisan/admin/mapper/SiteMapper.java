package com.jf.soulartisan.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.admin.entity.Site;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 站点表 Mapper
 */
@Mapper
public interface SiteMapper extends BaseMapper<Site> {

    /**
     * 根据站点编码查询站点
     *
     * @param siteCode 站点编码
     * @return 站点信息
     */
    Site selectBySiteCode(@Param("siteCode") String siteCode);

    /**
     * 根据管理员账号查询站点
     *
     * @param adminUsername 管理员账号
     * @return 站点信息
     */
    Site selectByAdminUsername(@Param("adminUsername") String adminUsername);

    /**
     * 根据域名查询站点
     *
     * @param domain 域名
     * @return 站点信息
     */
    Site selectByDomain(@Param("domain") String domain);

    /**
     * 统计站点下的用户数量
     *
     * @param siteId 站点ID
     * @return 用户数量
     */
    Long countUsersBySiteId(@Param("siteId") Long siteId);
}
