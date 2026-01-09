-- 给分镜表添加视频提示词字段
ALTER TABLE character_project_storyboards
    ADD COLUMN video_prompt TEXT AFTER scene_description;

-- 创建分镜视频表（一个分镜可以生成多条视频）
CREATE TABLE IF NOT EXISTS character_project_storyboard_videos
(
    id
    BIGINT
    AUTO_INCREMENT
    PRIMARY
    KEY,
    storyboard_id
    BIGINT
    NOT
    NULL
    COMMENT
    '分镜ID',
    project_id
    BIGINT
    NOT
    NULL
    COMMENT
    '角色项目ID',
    user_id
    BIGINT
    NOT
    NULL
    COMMENT
    '用户ID',
    site_id
    BIGINT
    NOT
    NULL
    COMMENT
    '站点ID',
    video_task_id
    BIGINT
    COMMENT
    '视频生成任务ID',
    task_id
    VARCHAR
(
    100
) COMMENT '外部任务ID',
    video_url VARCHAR
(
    500
) COMMENT '生成的视频URL',
    prompt TEXT COMMENT '使用的提示词',
    aspect_ratio VARCHAR
(
    20
) DEFAULT '16:9' COMMENT '视频宽高比',
    duration INT DEFAULT 15 COMMENT '视频时长（秒）',
    status VARCHAR
(
    20
) DEFAULT 'pending' COMMENT '状态：pending/generating/completed/failed',
    error_message TEXT COMMENT '错误信息',
    sort_order INT DEFAULT 0 COMMENT '排序序号',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_storyboard_id
(
    storyboard_id
),
    INDEX idx_project_id
(
    project_id
),
    INDEX idx_user_id
(
    user_id
),
    INDEX idx_status
(
    status
)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色项目分镜视频表';
