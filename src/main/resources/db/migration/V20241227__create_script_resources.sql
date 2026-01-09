-- 创建剧本资源表
-- 执行时间: 2024-12-27
-- 描述: 统一管理剧本下的角色和场景资源，支持视频资源和图片资源

CREATE TABLE IF NOT EXISTS `script_resources`
(
    `id`                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`             BIGINT       NOT NULL COMMENT '用户ID',
    `site_id`             BIGINT       NOT NULL COMMENT '站点ID',
    `script_id`           BIGINT       NULL COMMENT '剧本ID（可空，资源可独立存在）',
    `workflow_project_id` BIGINT       NOT NULL COMMENT '工作流项目ID',

    -- 资源基础信息
    `resource_type`       VARCHAR(50)  NOT NULL COMMENT '资源类型：video_character, video_scene, image_character, image_scene',
    `resource_name`       VARCHAR(255) NOT NULL COMMENT '资源名称',
    `resource_category`   VARCHAR(20)  NOT NULL COMMENT '资源分类：character-人物, scene-场景',

    -- 状态管理
    `status`              VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待处理, processing-处理中, completed-已完成, failed-失败',
    `error_message`       TEXT COMMENT '错误信息',

    -- 时间戳
    `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `completed_at`        DATETIME COMMENT '完成时间',

    -- 资源详情（JSON格式）
    `resource_details`    JSON         NOT NULL COMMENT '资源详情',

    PRIMARY KEY (`id`),
    KEY `idx_script_id` (`script_id`),
    KEY `idx_project_id` (`workflow_project_id`),
    KEY `idx_resource_type` (`resource_type`),
    KEY `idx_resource_category` (`resource_category`),
    KEY `idx_status` (`status`),
    KEY `idx_script_category` (`script_id`, `resource_category`),
    KEY `idx_user_site` (`user_id`, `site_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT ='剧本资源表';
