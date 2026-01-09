package com.jf.soulartisan.admin.dto.request;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 批量生成卡密请求
 */
@Data
public class CardKeyGenerateRequest {

    /**
     * 生成数量
     */
    private Integer count;

    /**
     * 积分值
     */
    private Integer points;

    /**
     * 批次号（可选，不填则自动生成）
     */
    private String batchNo;

    /**
     * 备注
     */
    private String remark;

    /**
     * 过期时间（可选）
     */
    private LocalDateTime expiredAt;
}
