-- 添加角色创建请求时间字段，用于超时重试判断（超过5分钟允许重新提交）
ALTER TABLE video_resources
    ADD COLUMN character_requested_at DATETIME DEFAULT NULL COMMENT '角色创建请求时间';
