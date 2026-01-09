-- 为工作流项目表添加风格字段
-- 执行时间: 2024-12-30
-- 描述: 添加风格设置，项目中的节点可自动应用项目风格

ALTER TABLE `workflow_projects`
    ADD COLUMN `style` VARCHAR(50) NULL DEFAULT NULL COMMENT '项目风格' AFTER `workflow_type`;

-- 添加索引以支持按风格查询
ALTER TABLE `workflow_projects`
    ADD INDEX `idx_style` (`style`);
