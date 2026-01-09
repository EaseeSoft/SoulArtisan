-- ----------------------------
-- V20250105 剧本成员功能
-- 新增 script_members 表，存储剧本和用户的成员关系
-- ----------------------------

CREATE TABLE IF NOT EXISTS `script_members`
(
    `id`         bigint                                                       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `script_id`  bigint                                                       NOT NULL COMMENT '剧本ID',
    `user_id`    bigint                                                       NOT NULL COMMENT '用户ID',
    `role`       varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'member' COMMENT '角色: creator-创建者, member-成员',
    `created_at` datetime                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE KEY `uk_script_user` (`script_id`, `user_id`) USING BTREE COMMENT '剧本用户唯一索引',
    INDEX `idx_script_id` (`script_id` ASC) USING BTREE,
    INDEX `idx_user_id` (`user_id` ASC) USING BTREE
) ENGINE = InnoDB
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci
    COMMENT = '剧本成员关联表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- 为现有剧本添加创建者记录
-- ----------------------------
INSERT INTO `script_members` (`script_id`, `user_id`, `role`, `created_at`)
SELECT `id`, `user_id`, 'creator', `created_at`
FROM `scripts`
WHERE NOT EXISTS (SELECT 1 FROM `script_members` sm WHERE sm.script_id = scripts.id AND sm.user_id = scripts.user_id);


-- 给视频资源表添加 aspect_ratio 字段
ALTER TABLE `video_resources`
    ADD COLUMN `aspect_ratio` VARCHAR(20) NULL DEFAULT NULL COMMENT '视频比例' AFTER `video_result_url`;