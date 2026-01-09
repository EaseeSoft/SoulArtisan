-- ----------------------------
-- Table structure for points_record (积分记录表)
-- ----------------------------
DROP TABLE IF EXISTS `points_record`;
CREATE TABLE `points_record`
(
    `id`            bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `site_id`       bigint                                                        NOT NULL COMMENT '所属站点ID',
    `user_id`       bigint                                                        NOT NULL COMMENT '用户ID',
    `type`          tinyint                                                       NOT NULL COMMENT '类型: 1-收入 2-支出',
    `points`        int                                                           NOT NULL COMMENT '积分变动值（正数）',
    `balance`       int                                                           NOT NULL COMMENT '变动后余额',
    `source`        varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '来源: card_key-卡密兑换 admin_adjust-管理员调整 task_consume-任务消耗 register-注册赠送',
    `source_id`     bigint                                                        NULL     DEFAULT NULL COMMENT '来源关联ID（如卡密ID、任务ID等）',
    `remark`        varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '备注',
    `operator_id`   bigint                                                        NULL     DEFAULT NULL COMMENT '操作人ID（管理员调整时记录）',
    `operator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '操作人名称',
    `created_at`    datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE,
    INDEX `idx_user_id` (`user_id` ASC) USING BTREE,
    INDEX `idx_type` (`type` ASC) USING BTREE,
    INDEX `idx_source` (`source` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE
) ENGINE = InnoDB
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '积分记录表'
  ROW_FORMAT = Dynamic;
