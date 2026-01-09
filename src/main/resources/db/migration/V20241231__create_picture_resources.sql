-- 创建图片资源表
-- 执行时间: 2024-12-31
-- 描述: 存储剧本相关的图片资源，包括角色、场景、道具、技能等类型

CREATE TABLE IF NOT EXISTS `picture_resources`
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
    `name`
    VARCHAR
(
    255
) NOT NULL COMMENT '资源名称',
    `type` VARCHAR
(
    20
) NOT NULL COMMENT '资源类型：character-角色, scene-场景, prop-道具, skill-技能',
    `image_url` VARCHAR
(
    500
) NOT NULL COMMENT '图片地址',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
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
    KEY `idx_type`
(
    `type`
),
    KEY `idx_script_type`
(
    `script_id`,
    `type`
)
    ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_0900_ai_ci COMMENT ='图片资源表';

ALTER TABLE picture_resources
    ADD COLUMN prompt VARCHAR(1000) COMMENT '提示词' AFTER image_url;

-- 添加状态字段：pending-未生成, generating-生成中, generated-已生成
ALTER TABLE picture_resources
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'generated' COMMENT '状态：pending-未生成, generating-生成中, generated-已生成' AFTER prompt;
ALTER TABLE picture_resources
    ADD INDEX idx_status (status);
ALTER TABLE picture_resources
    ADD INDEX idx_script_status (script_id, status);