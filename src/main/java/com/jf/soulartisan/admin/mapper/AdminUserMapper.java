package com.jf.soulartisan.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.admin.entity.AdminUser;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 管理员表 Mapper
 */
@Mapper
public interface AdminUserMapper extends BaseMapper<AdminUser> {

    /**
     * 根据用户名查询管理员
     *
     * @param username 用户名
     * @return 管理员信息
     */
    AdminUser selectByUsername(@Param("username") String username);

    /**
     * 根据站点ID查询站点管理员
     *
     * @param siteId 站点ID
     * @return 管理员信息
     */
    AdminUser selectBySiteId(@Param("siteId") Long siteId);

    /**
     * 根据站点ID删除站点管理员
     *
     * @param siteId 站点ID
     * @return 删除数量
     */
    int deleteBySiteId(@Param("siteId") Long siteId);

    /**
     * 更新最后登录信息
     *
     * @param id          管理员ID
     * @param lastLoginIp 最后登录IP
     * @return 更新数量
     */
    int updateLastLoginInfo(@Param("id") Long id, @Param("lastLoginIp") String lastLoginIp);
}
