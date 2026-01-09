-- 添加工作流类型字段到 workflow_projects 表
-- 执行时间: 2024-XX-XX
-- 描述: 支持区分角色资源工作流和分镜图工作流

ALTER TABLE `workflow_projects`
    ADD COLUMN `workflow_type` VARCHAR(50) DEFAULT 'character-resource' COMMENT '工作流类型: character-resource(角色资源), storyboard(分镜图)'
        AFTER `thumbnail`;

-- 创建索引以支持按类型筛选
CREATE INDEX `idx_workflow_type` ON `workflow_projects` (`workflow_type`);
