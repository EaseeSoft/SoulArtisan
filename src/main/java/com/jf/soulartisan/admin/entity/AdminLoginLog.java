package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jf.soulartisan.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 管理员登录日志表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("admin_login_log")
public class AdminLoginLog extends BaseEntity {

    /**
     * 管理员ID
     */
    private Long adminId;

    /**
     * 用户名
     */
    private String username;

    /**
     * 登录IP
     */
    private String ip;

    /**
     * IP归属地
     */
    private String location;

    /**
     * 浏览器
     */
    private String browser;

    /**
     * 操作系统
     */
    private String os;

    /**
     * 状态: 0-失败 1-成功
     */
    private Integer status;

    /**
     * 提示消息
     */
    private String message;

    /**
     * 状态常量
     */
    public static class Status {
        public static final int FAILED = 0;
        public static final int SUCCESS = 1;
    }
}
