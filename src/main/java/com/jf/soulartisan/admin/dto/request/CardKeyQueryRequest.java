package com.jf.soulartisan.admin.dto.request;

import lombok.Data;

/**
 * 卡密查询请求
 */
@Data
public class CardKeyQueryRequest {

    /**
     * 卡密码
     */
    private String cardCode;

    /**
     * 批次号
     */
    private String batchNo;

    /**
     * 状态: 0-未使用 1-已使用 2-已禁用
     */
    private Integer status;
}
