-- ----------------------------
-- Table structure for card_key (卡密表)
-- ----------------------------
DROP TABLE IF EXISTS `card_key`;
CREATE TABLE `card_key`
(
    `id`         bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `site_id`    bigint                                                        NOT NULL COMMENT '所属站点ID',
    `card_code`  varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '卡密码（唯一）',
    `points`     int                                                           NOT NULL DEFAULT 0 COMMENT '积分值',
    `status`     tinyint                                                       NOT NULL DEFAULT 0 COMMENT '状态: 0-未使用 1-已使用 2-已禁用',
    `batch_no`   varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '批次号',
    `used_by`    bigint                                                        NULL     DEFAULT NULL COMMENT '使用者用户ID',
    `used_at`    datetime                                                      NULL     DEFAULT NULL COMMENT '使用时间',
    `remark`     varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '备注',
    `expired_at` datetime                                                      NULL     DEFAULT NULL COMMENT '过期时间',
    `created_at` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by` bigint                                                        NULL     DEFAULT NULL COMMENT '创建人ID',
    `updated_by` bigint                                                        NULL     DEFAULT NULL COMMENT '更新人ID',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_card_code` (`card_code` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE,
    INDEX `idx_batch_no` (`batch_no` ASC) USING BTREE,
    INDEX `idx_used_by` (`used_by` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE
) ENGINE = InnoDB
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '卡密表'
  ROW_FORMAT = Dynamic;
