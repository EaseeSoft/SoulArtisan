package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 卡密表
 */
@Data
@TableName("card_key")
public class CardKey implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属站点ID
     */
    private Long siteId;

    /**
     * 卡密码（唯一）
     */
    private String cardCode;

    /**
     * 积分值
     */
    private Integer points;

    /**
     * 状态: 0-未使用 1-已使用 2-已禁用
     */
    private Integer status;

    /**
     * 批次号
     */
    private String batchNo;

    /**
     * 使用者用户ID
     */
    private Long usedBy;

    /**
     * 使用时间
     */
    private LocalDateTime usedAt;

    /**
     * 备注
     */
    private String remark;

    /**
     * 过期时间
     */
    private LocalDateTime expiredAt;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 创建人ID
     */
    @TableField(fill = FieldFill.INSERT)
    private Long createdBy;

    /**
     * 更新人ID
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private Long updatedBy;

    /**
     * 卡密状态常量
     */
    public static class Status {
        /**
         * 未使用
         */
        public static final int UNUSED = 0;
        /**
         * 已使用
         */
        public static final int USED = 1;
        /**
         * 已禁用
         */
        public static final int DISABLED = 2;
    }
}
