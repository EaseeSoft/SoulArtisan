package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jf.soulartisan.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 管理员操作日志表
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("admin_operation_log")
public class AdminOperationLog extends BaseEntity {

    /**
     * 管理员ID
     */
    private Long adminId;

    /**
     * 管理员名称
     */
    private String adminName;

    /**
     * 站点ID
     */
    private Long siteId;

    /**
     * 操作模块
     */
    private String module;

    /**
     * 操作类型
     */
    private String operation;

    /**
     * 请求方法
     */
    private String method;

    /**
     * 请求参数
     */
    private String params;

    /**
     * 返回结果
     */
    private String result;

    /**
     * 操作IP
     */
    private String ip;

    /**
     * IP归属地
     */
    private String location;

    /**
     * 用户代理
     */
    private String userAgent;

    /**
     * 状态: 0-失败 1-成功
     */
    private Integer status;

    /**
     * 错误信息
     */
    private String errorMsg;

    /**
     * 耗时(ms)
     */
    private Integer costTime;

    /**
     * 状态常量
     */
    public static class Status {
        public static final int FAILED = 0;
        public static final int SUCCESS = 1;
    }
}
