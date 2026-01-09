-- ====================================================
-- 数据库字段统一迁移脚本
-- 统一将 create_time/update_time/create_by/update_by
-- 改为 created_at/updated_at/created_by/updated_by
-- ====================================================

-- 1. admin_login_log 表
-- 重命名 login_time -> created_at, 添加 updated_at, created_by, updated_by
ALTER TABLE `admin_login_log`
    CHANGE COLUMN `login_time` `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`,
    ADD COLUMN `created_by` BIGINT   NULL     DEFAULT NULL COMMENT '创建人ID' AFTER `updated_at`,
    ADD COLUMN `updated_by` BIGINT   NULL     DEFAULT NULL COMMENT '更新人ID' AFTER `created_by`;

-- 删除旧索引并创建新索引
ALTER TABLE `admin_login_log`
    DROP INDEX `idx_login_time`,
    ADD INDEX `idx_created_at` (`created_at` ASC);


-- 2. admin_operation_log 表
-- 重命名 create_time -> created_at, 添加 updated_at, created_by, updated_by
ALTER TABLE `admin_operation_log`
    CHANGE COLUMN `create_time` `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间' AFTER `created_at`,
    ADD COLUMN `created_by` BIGINT   NULL     DEFAULT NULL COMMENT '创建人ID' AFTER `updated_at`,
    ADD COLUMN `updated_by` BIGINT   NULL     DEFAULT NULL COMMENT '更新人ID' AFTER `created_by`;

-- 删除旧索引并创建新索引
ALTER TABLE `admin_operation_log`
    DROP INDEX `idx_create_time`,
    ADD INDEX `idx_created_at` (`created_at` ASC);


-- 3. admin_user 表
-- 重命名字段
ALTER TABLE `admin_user`
    CHANGE COLUMN `create_time` `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CHANGE COLUMN `update_time` `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CHANGE COLUMN `create_by` `created_by` BIGINT NULL DEFAULT NULL COMMENT '创建人ID',
    CHANGE COLUMN `update_by` `updated_by` BIGINT NULL DEFAULT NULL COMMENT '更新人ID';


-- 4. site 表
-- 重命名字段
ALTER TABLE `site`
    CHANGE COLUMN `create_time` `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CHANGE COLUMN `update_time` `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    CHANGE COLUMN `create_by` `created_by` BIGINT NULL DEFAULT NULL COMMENT '创建人ID',
    CHANGE COLUMN `update_by` `updated_by` BIGINT NULL DEFAULT NULL COMMENT '更新人ID';


-- 5. site_config 表
-- 重命名字段, 添加 created_by, updated_by
ALTER TABLE `site_config`
    CHANGE COLUMN `create_time` `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    CHANGE COLUMN `update_time` `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    ADD COLUMN `created_by` BIGINT NULL DEFAULT NULL COMMENT '创建人ID' AFTER `updated_at`,
    ADD COLUMN `updated_by` BIGINT NULL DEFAULT NULL COMMENT '更新人ID' AFTER `created_by`;


-- ====================================================
-- 完成迁移
-- ====================================================
