-- 并发限制功能 - 系统配置表扩展
-- 执行时间: 2025-12-30

-- 图片生成并发限制
ALTER TABLE system_config
    ADD COLUMN image_concurrency_limit INT DEFAULT 10
        COMMENT '图片生成并发任务数限制，0表示不限制';

-- 视频生成并发限制
ALTER TABLE system_config
    ADD COLUMN video_concurrency_limit INT DEFAULT 5
        COMMENT '视频生成并发任务数限制，0表示不限制';
