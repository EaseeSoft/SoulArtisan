package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jf.soulartisan.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 管理员表（极简版：仅2个角色）
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("admin_user")
public class AdminUser extends BaseEntity {

    /**
     * 用户名
     */
    private String username;

    /**
     * 密码(BCrypt加密)
     */
    private String password;

    /**
     * 真实姓名
     */
    private String realName;

    /**
     * 手机号
     */
    private String phone;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 头像
     */
    private String avatar;

    /**
     * 角色: SYSTEM_ADMIN-系统管理员 SITE_ADMIN-站点管理员
     */
    private String role;

    /**
     * 所属站点ID（站点管理员必填，系统管理员为NULL）
     */
    private Long siteId;

    /**
     * 状态: 0-禁用 1-启用
     */
    private Integer status;

    /**
     * 最后登录时间
     */
    private LocalDateTime lastLoginTime;

    /**
     * 最后登录IP
     */
    private String lastLoginIp;

    /**
     * 角色常量
     */
    public static class Role {
        public static final String SYSTEM_ADMIN = "SYSTEM_ADMIN";
        public static final String SITE_ADMIN = "SITE_ADMIN";
    }

    /**
     * 状态常量
     */
    public static class Status {
        public static final int DISABLED = 0;
        public static final int ENABLED = 1;
    }
}
