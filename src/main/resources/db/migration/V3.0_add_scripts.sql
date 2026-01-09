-- ----------------------------
-- V3.0 剧本管理功能
-- 1. 新增 scripts 表（剧本表）
-- 2. workflow_projects 表添加 script_id 字段
-- 3. characters 表添加 script_id 字段
-- ----------------------------

-- ----------------------------
-- Table structure for scripts (剧本表)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `scripts`
(
    `id`          bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '剧本ID',
    `user_id`     bigint                                                        NOT NULL COMMENT '用户ID',
    `site_id`     bigint                                                        NOT NULL DEFAULT 1 COMMENT '所属站点ID',
    `name`        varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '剧本名称',
    `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '剧本描述',
    `cover_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '封面图URL',
    `status`      varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL DEFAULT 'active' COMMENT '状态: active-活跃, archived-归档',
    `created_at`  datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_user_id` (`user_id` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE
) ENGINE = InnoDB
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
    COMMENT = '剧本表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- workflow_projects 添加 script_id 字段
-- ----------------------------
-- 检查字段是否存在，如果不存在则添加
SET @exist := (SELECT COUNT(*)
               FROM information_schema.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'workflow_projects'
                 AND COLUMN_NAME = 'script_id');

SET @sql := IF(@exist = 0,
               'ALTER TABLE `workflow_projects` ADD COLUMN `script_id` bigint NULL DEFAULT NULL COMMENT ''关联的剧本ID'' AFTER `site_id`',
               'SELECT 1'
            );

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加索引（如果不存在）
SET @idx_exist := (SELECT COUNT(*)
                   FROM information_schema.STATISTICS
                   WHERE TABLE_SCHEMA = DATABASE()
                     AND TABLE_NAME = 'workflow_projects'
                     AND INDEX_NAME = 'idx_script_id');

SET @idx_sql := IF(@idx_exist = 0,
                   'ALTER TABLE `workflow_projects` ADD INDEX `idx_script_id` (`script_id` ASC)',
                   'SELECT 1'
                );

PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ----------------------------
-- characters 添加 script_id 字段
-- ----------------------------
SET @char_exist := (SELECT COUNT(*)
                    FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'characters'
                      AND COLUMN_NAME = 'script_id');

SET @char_sql := IF(@char_exist = 0,
                    'ALTER TABLE `characters` ADD COLUMN `script_id` bigint NULL DEFAULT NULL COMMENT ''所属剧本ID'' AFTER `site_id`',
                    'SELECT 1'
                 );

PREPARE stmt FROM @char_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加索引（如果不存在）
SET @char_idx_exist := (SELECT COUNT(*)
                        FROM information_schema.STATISTICS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = 'characters'
                          AND INDEX_NAME = 'idx_script_id');

SET @char_idx_sql := IF(@char_idx_exist = 0,
                        'ALTER TABLE `characters` ADD INDEX `idx_script_id` (`script_id` ASC)',
                        'SELECT 1'
                     );

PREPARE stmt FROM @char_idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
