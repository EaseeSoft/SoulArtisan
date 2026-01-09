-- 为 picture_resources 表添加 project_id 字段
-- 执行时间: 2025-01-04
-- 描述: 支持图片资源关联项目，不仅仅是剧本

-- 添加 project_id 字段
ALTER TABLE picture_resources
    ADD COLUMN project_id BIGINT NULL COMMENT '项目ID' AFTER site_id;

-- 添加索引
ALTER TABLE picture_resources
    ADD INDEX idx_project_id (project_id);

-- 添加项目+类型复合索引
ALTER TABLE picture_resources
    ADD INDEX idx_project_type (project_id, type);
