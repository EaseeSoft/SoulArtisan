package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jf.soulartisan.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 站点表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("site")
public class Site extends BaseEntity {

    /**
     * 站点名称
     */
    private String siteName;

    /**
     * 站点编码（唯一标识）
     */
    private String siteCode;

    /**
     * 站点域名
     */
    private String domain;

    /**
     * Logo URL
     */
    private String logo;

    /**
     * 站点描述
     */
    private String description;

    /**
     * 站点管理员账号
     */
    private String adminUsername;

    /**
     * 状态: 0-禁用 1-启用
     */
    private Integer status;

    /**
     * 排序
     */
    private Integer sort;

    /**
     * 站点状态常量
     */
    public static class Status {
        public static final int DISABLED = 0;
        public static final int ENABLED = 1;
    }
}
