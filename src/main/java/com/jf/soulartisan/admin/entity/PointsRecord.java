package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 积分记录表
 */
@Data
@TableName("points_record")
public class PointsRecord implements Serializable {

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
     * 用户ID
     */
    private Long userId;

    /**
     * 类型: 1-收入 2-支出
     */
    private Integer type;

    /**
     * 积分变动值（正数）
     */
    private Integer points;

    /**
     * 变动后余额
     */
    private Integer balance;

    /**
     * 来源: card_key-卡密兑换 admin_adjust-管理员调整 task_consume-任务消耗 register-注册赠送
     */
    private String source;

    /**
     * 来源关联ID（如卡密ID、任务ID等）
     */
    private Long sourceId;

    /**
     * 备注
     */
    private String remark;

    /**
     * 操作人ID（管理员调整时记录）
     */
    private Long operatorId;

    /**
     * 操作人名称
     */
    private String operatorName;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 类型常量
     */
    public static class Type {
        /**
         * 收入
         */
        public static final int INCOME = 1;
        /**
         * 支出
         */
        public static final int EXPENSE = 2;
    }

    /**
     * 来源常量
     */
    public static class Source {
        /**
         * 卡密兑换
         */
        public static final String CARD_KEY = "card_key";
        /**
         * 管理员调整
         */
        public static final String ADMIN_ADJUST = "admin_adjust";
        /**
         * 任务消耗
         */
        public static final String TASK_CONSUME = "task_consume";
        /**
         * 注册赠送
         */
        public static final String REGISTER = "register";
    }
}
