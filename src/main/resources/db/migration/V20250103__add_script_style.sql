-- 为剧本表添加风格字段
-- 执行时间: 2025-01-03
-- 描述: 添加风格设置，剧本可以设置整体风格

ALTER TABLE `scripts`
    ADD COLUMN `style` VARCHAR(50) NULL DEFAULT NULL COMMENT '剧本风格' AFTER `status`;

-- 添加索引以支持按风格查询
ALTER TABLE `scripts`
    ADD INDEX `idx_style` (`style`);
