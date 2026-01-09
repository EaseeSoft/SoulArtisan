-- 创建视频资源表
-- 执行时间: 2025-01-04
-- 描述: 统一管理视频资源，支持从剧本创建资源→生成视频→提取角色的完整流程

-- 1. 创建 video_resources 表
CREATE TABLE IF NOT EXISTS `video_resources`
(
    `id`
    BIGINT
    NOT
    NULL
    AUTO_INCREMENT
    COMMENT
    '主键ID',
    `user_id`
    BIGINT
    NOT
    NULL
    COMMENT
    '用户ID',
    `site_id`
    BIGINT
    NOT
    NULL
    COMMENT
    '站点ID',
    `script_id`
    BIGINT
    NULL
    COMMENT
    '剧本ID',
    `workflow_project_id`
    BIGINT
    NULL
    COMMENT
    '工作流项目ID',

    -- 资源基础信息
    `resource_name`
    VARCHAR
(
    255
) NOT NULL COMMENT '资源名称',
    `resource_type` VARCHAR
(
    50
) NOT NULL DEFAULT 'character' COMMENT '资源类型: character-人物, scene-场景, prop-道具, skill-技能',
    `prompt` TEXT NULL COMMENT '资源描述/提示词',

    -- 视频生成相关
    `video_task_id` VARCHAR
(
    255
) NULL COMMENT '视频生成任务ID',
    `video_url` VARCHAR
(
    1024
) NULL COMMENT '源视频URL',
    `video_result_url` VARCHAR
(
    1024
) NULL COMMENT '生成的视频结果URL',

    -- 视频截取时间
    `start_time` DECIMAL
(
    10,
    3
) NULL COMMENT '视频截取开始时间(秒)',
    `end_time` DECIMAL
(
    10,
    3
) NULL COMMENT '视频截取结束时间(秒)',
    `timestamps` VARCHAR
(
    100
) NULL COMMENT '时间戳范围，格式: 起始秒,结束秒',

    -- 角色生成相关
    `generation_task_id` VARCHAR
(
    255
) NULL COMMENT '角色生成任务ID',
    `character_id` VARCHAR
(
    255
) NULL COMMENT '生成的角色ID',
    `character_image_url` VARCHAR
(
    1024
) NULL COMMENT '角色图片URL',
    `character_video_url` VARCHAR
(
    1024
) NULL COMMENT '角色视频URL',

    -- 状态管理
    `status` VARCHAR
(
    50
) NOT NULL DEFAULT 'not_generated' COMMENT '状态: not_generated-未生成, pending-待处理, processing-处理中, completed-已完成, failed-失败',
    `error_message` TEXT NULL COMMENT '错误信息',

    -- 其他属性
    `is_real_person` TINYINT
(
    1
) NOT NULL DEFAULT 0 COMMENT '是否真人角色',
    `result_data` JSON NULL COMMENT '回调结果数据',

    -- 时间戳
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `completed_at` DATETIME NULL COMMENT '完成时间',
    PRIMARY KEY
(
    `id`
),
    KEY `idx_user_id`
(
    `user_id`
),
    KEY `idx_site_id`
(
    `site_id`
),
    KEY `idx_script_id`
(
    `script_id`
),
    KEY `idx_project_id`
(
    `workflow_project_id`
),
    KEY `idx_resource_type`
(
    `resource_type`
),
    KEY `idx_status`
(
    `status`
),
    KEY `idx_generation_task_id`
(
    `generation_task_id`
),
    KEY `idx_video_task_id`
(
    `video_task_id`
),
    KEY `idx_user_site`
(
    `user_id`,
    `site_id`
),
    KEY `idx_script_type`
(
    `script_id`,
    `resource_type`
)
    ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_0900_ai_ci COMMENT ='视频资源表';

-- 2. 从 characters 表迁移数据到 video_resources 表
INSERT INTO `video_resources` (`id`,
                               `user_id`,
                               `site_id`,
                               `script_id`,
                               `workflow_project_id`,
                               `resource_name`,
                               `resource_type`,
                               `prompt`,
                               `video_task_id`,
                               `video_url`,
                               `video_result_url`,
                               `start_time`,
                               `end_time`,
                               `timestamps`,
                               `generation_task_id`,
                               `character_id`,
                               `character_image_url`,
                               `character_video_url`,
                               `status`,
                               `error_message`,
                               `is_real_person`,
                               `result_data`,
                               `created_at`,
                               `updated_at`,
                               `completed_at`)
SELECT `id`,
       `user_id`,
       `site_id`,
       `script_id`,
       `workflow_project_id`,
       COALESCE(`character_name`, '未命名资源') AS `resource_name`,
       COALESCE(`character_type`, 'character')  AS `resource_type`,
       `prompt`,
       `video_task_id`,
       `video_url`,
       `character_video_url`                    AS `video_result_url`,
       `start_time`,
       `end_time`,
       `timestamps`,
       `generation_task_id`,
       `character_id`,
       `character_image_url`,
       `character_video_url`,
       `status`,
       `error_message`,
       COALESCE(`is_real_person`, 0)            AS `is_real_person`,
       `result_data`,
       `created_at`,
       `updated_at`,
       `completed_at`
FROM `characters`;

-- 3. 更新 video_resources 的自增ID起点
SELECT IFNULL(MAX(id), 0) + 1
INTO @max_id
FROM `video_resources`;
SET
@sql = CONCAT('ALTER TABLE `video_resources` AUTO_INCREMENT = ', @max_id);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. 删除 script_resources 表
DROP TABLE IF EXISTS `script_resources`;

-- 5. 删除 characters 表（数据已迁移）
-- 先备份表，然后删除
-- DROP TABLE IF EXISTS `characters`;
