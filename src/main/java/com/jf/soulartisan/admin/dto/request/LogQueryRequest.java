package com.jf.soulartisan.admin.dto.request;

import lombok.Data;

/**
 * 日志查询请求
 */
@Data
public class LogQueryRequest {

    /**
     * 管理员ID
     */
    private Long adminId;

    /**
     * 管理员名称（模糊搜索）
     */
    private String adminName;

    /**
     * 站点ID
     */
    private Long siteId;

    /**
     * 模块（操作日志专用）
     */
    private String module;

    /**
     * 操作类型（操作日志专用）
     */
    private String operation;

    /**
     * 状态: 0-失败 1-成功
     */
    private Integer status;

    /**
     * IP地址
     */
    private String ip;

    /**
     * 开始时间
     */
    private String startTime;

    /**
     * 结束时间
     */
    private String endTime;
}
