-- ----------------------------
-- Table structure for points_config (积分配置表 - 全局配置)
-- ----------------------------
DROP TABLE IF EXISTS `points_config`;
CREATE TABLE `points_config`
(
    `id`           bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `config_key`   varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
    `config_value` int                                                           NOT NULL DEFAULT 0 COMMENT '消耗积分值',
    `config_name`  varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置名称',
    `description`  varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '描述',
    `is_enabled`   tinyint(1)                                                    NOT NULL DEFAULT 1 COMMENT '是否启用: 0-禁用 1-启用',
    `created_at`   datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`   datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `uk_config_key` (`config_key`) USING BTREE
) ENGINE = InnoDB
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '积分配置表(全局)'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- 初始化默认配置数据
-- ----------------------------
INSERT INTO `points_config` (`config_key`, `config_value`, `config_name`, `description`, `is_enabled`)
VALUES ('image_generation', 10, '生成图片', '每次生成图片消耗的积分', 1),
       ('video_10s', 50, '生成10秒视频', '生成10秒视频消耗的积分', 1),
       ('video_15s', 80, '生成15秒视频', '生成15秒视频消耗的积分', 1),
       ('video_25s', 150, '生成25秒视频', '生成25秒视频消耗的积分', 1),
       ('gemini_chat', 5, 'AI对话(每次)', '每次AI对话消耗的积分', 1);
