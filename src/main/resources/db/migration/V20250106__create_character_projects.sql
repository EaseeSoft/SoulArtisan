-- 角色项目表
CREATE TABLE IF NOT EXISTS `character_projects`
(
    `id`             BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键',
    `user_id`        BIGINT       NOT NULL COMMENT '用户ID',
    `site_id`        BIGINT       NOT NULL COMMENT '站点ID',
    `name`           VARCHAR(255) NOT NULL COMMENT '项目名称',
    `description`    TEXT COMMENT '项目描述',
    `script_id`      BIGINT      DEFAULT NULL COMMENT '关联剧本ID',
    `style`          VARCHAR(50) DEFAULT NULL COMMENT '风格',
    `script_content` LONGTEXT COMMENT '剧本内容',
    `current_step`   INT         DEFAULT 1 COMMENT '当前步骤：1-输入剧本，2-提取资源，3-分镜创作',
    `status`         VARCHAR(20) DEFAULT 'draft' COMMENT '项目状态：draft/in_progress/completed',
    `created_at`     DATETIME    DEFAULT CURRENT_TIMESTAMP,
    `updated_at`     DATETIME    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_site_id` (`site_id`),
    KEY `idx_script_id` (`script_id`),
    KEY `idx_status` (`status`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='角色项目表';

-- 角色项目资源关联表（项目-资源多对多）
CREATE TABLE IF NOT EXISTS `character_project_resources`
(
    `id`               BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键',
    `project_id`       BIGINT      NOT NULL COMMENT '角色项目ID',
    `resource_id`      BIGINT      NOT NULL COMMENT '资源ID（关联 video_resources.id）',
    `source_type`      VARCHAR(20) NOT NULL DEFAULT 'extract' COMMENT '来源类型：extract-提取创建，script-剧本选择',
    `source_script_id` BIGINT               DEFAULT NULL COMMENT '来源剧本ID（source_type=script 时有值）',
    `sort_order`       INT                  DEFAULT 0 COMMENT '排序顺序',
    `created_at`       DATETIME             DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_project_resource` (`project_id`, `resource_id`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_resource_id` (`resource_id`),
    KEY `idx_source_script_id` (`source_script_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='角色项目资源关联表';

-- 角色项目分镜表
CREATE TABLE IF NOT EXISTS `character_project_storyboards`
(
    `id`                BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `project_id`        BIGINT NOT NULL COMMENT '角色项目ID',
    `user_id`           BIGINT NOT NULL COMMENT '用户ID',
    `site_id`           BIGINT NOT NULL COMMENT '站点ID',
    `scene_number`      INT    NOT NULL COMMENT '分镜序号',
    `scene_name`        VARCHAR(255) DEFAULT NULL COMMENT '分镜名称',
    `scene_description` TEXT COMMENT '分镜描述',
    `video_task_id`     BIGINT       DEFAULT NULL COMMENT '视频生成任务ID（关联 video_generation_tasks）',
    `video_url`         VARCHAR(500) DEFAULT NULL COMMENT '生成的视频URL',
    `status`            VARCHAR(20)  DEFAULT 'pending' COMMENT '状态：pending/generating/completed/failed',
    `error_message`     TEXT COMMENT '错误信息',
    `created_at`        DATETIME     DEFAULT CURRENT_TIMESTAMP,
    `updated_at`        DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_project_id` (`project_id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_scene_number` (`scene_number`),
    KEY `idx_status` (`status`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='角色项目分镜表';

-- 分镜资源关联表（分镜-资源多对多）
CREATE TABLE IF NOT EXISTS `character_project_storyboard_resources`
(
    `id`            BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `storyboard_id` BIGINT NOT NULL COMMENT '分镜ID',
    `resource_id`   BIGINT NOT NULL COMMENT '资源ID（关联 video_resources.id）',
    `resource_role` VARCHAR(50) DEFAULT NULL COMMENT '资源在分镜中的角色：main_character-主角，supporting-配角，scene-场景，prop-道具',
    `sort_order`    INT         DEFAULT 0 COMMENT '排序顺序',
    `created_at`    DATETIME    DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_storyboard_resource` (`storyboard_id`, `resource_id`),
    KEY `idx_storyboard_id` (`storyboard_id`),
    KEY `idx_resource_id` (`resource_id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4 COMMENT ='分镜资源关联表';

-- 扩展 video_generation_tasks 表
ALTER TABLE `video_generation_tasks`
    ADD COLUMN `character_project_id` BIGINT DEFAULT NULL COMMENT '角色项目ID' AFTER `project_id`,
    ADD COLUMN `storyboard_id` BIGINT DEFAULT NULL COMMENT '分镜ID' AFTER `character_project_id`;

-- 添加索引（如果不存在）
CREATE INDEX `idx_character_project_id` ON `video_generation_tasks` (`character_project_id`);
CREATE INDEX `idx_storyboard_id` ON `video_generation_tasks` (`storyboard_id`);
