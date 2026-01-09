-- ----------------------------
-- 系统配置表
-- 用于存储管理后台的全局配置，如系统标题、Logo、版权信息等
-- 该表只有一条记录
-- ----------------------------

DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config`
(
    `id`             bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `system_title`   varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '系统标题',
    `system_logo`    varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '系统Logo URL',
    `system_favicon` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '系统Favicon URL',
    `copyright`      varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '版权信息',
    `footer_text`    varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '页脚文字',
    `icp_beian`      varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT 'ICP备案号',
    `login_bg_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '登录页背景图URL',
    `login_title`    varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '登录页标题',
    `login_subtitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '登录页副标题',
    `primary_color`  varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '主题色',
    `created_at`     datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`     datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `created_by`     bigint                                                        NULL     DEFAULT NULL COMMENT '创建人',
    `updated_by`     bigint                                                        NULL     DEFAULT NULL COMMENT '更新人',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统配置表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- 插入默认配置
-- ----------------------------
INSERT INTO `system_config` (`id`, `system_title`, `copyright`, `login_title`, `login_subtitle`, `primary_color`)
VALUES (1, '易企漫剧平台', '© 2025 易企漫剧平台', '易企漫剧平台', '登录以继续使用系统', '#6366f1');
