/*
 Navicat Premium Data Transfer

 Source Server         : agent_video
 Source Server Type    : MySQL
 Source Server Version : 80405
 Source Host           : 43.143.57.153:3306
 Source Schema         : agent_video

 Target Server Type    : MySQL
 Target Server Version : 80405
 File Encoding         : 65001

 Date: 18/12/2025 10:54:06
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admin_login_log
-- ----------------------------
DROP TABLE IF EXISTS `admin_login_log`;
CREATE TABLE `admin_login_log`
(
    `id`         bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `admin_id`   bigint                                                        NULL     DEFAULT NULL COMMENT '管理员ID',
    `username`   varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '用户名',
    `ip`         varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '登录IP',
    `location`   varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT 'IP归属地',
    `browser`    varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '浏览器',
    `os`         varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '操作系统',
    `status`     tinyint                                                       NOT NULL COMMENT '状态: 0-失败 1-成功',
    `message`    varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '提示消息',
    `login_time` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_admin_id` (`admin_id` ASC) USING BTREE,
    INDEX `idx_login_time` (`login_time` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 2
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员登录日志表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for admin_operation_log
-- ----------------------------
DROP TABLE IF EXISTS `admin_operation_log`;
CREATE TABLE `admin_operation_log`
(
    `id`          bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `admin_id`    bigint                                                        NOT NULL COMMENT '管理员ID',
    `admin_name`  varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '管理员名称',
    `site_id`     bigint                                                        NULL     DEFAULT NULL COMMENT '站点ID',
    `module`      varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '操作模块',
    `operation`   varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '操作类型',
    `method`      varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '请求方法',
    `params`      text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '请求参数',
    `result`      text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '返回结果',
    `ip`          varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '操作IP',
    `location`    varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT 'IP归属地',
    `user_agent`  varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '用户代理',
    `status`      tinyint                                                       NOT NULL COMMENT '状态: 0-失败 1-成功',
    `error_msg`   text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '错误信息',
    `cost_time`   int                                                           NULL     DEFAULT NULL COMMENT '耗时(ms)',
    `create_time` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_admin_id` (`admin_id` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE,
    INDEX `idx_create_time` (`create_time` ASC) USING BTREE,
    INDEX `idx_module` (`module` ASC) USING BTREE
) ENGINE = InnoDB
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员操作日志表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for admin_user
-- ----------------------------
DROP TABLE IF EXISTS `admin_user`;
CREATE TABLE `admin_user`
(
    `id`              bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `username`        varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '用户名',
    `password`        varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码(BCrypt加密)',
    `real_name`       varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '真实姓名',
    `phone`           varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '手机号',
    `email`           varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '邮箱',
    `avatar`          varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '头像',
    `role`            varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '角色: SYSTEM_ADMIN-系统管理员 SITE_ADMIN-站点管理员',
    `site_id`         bigint                                                        NULL     DEFAULT NULL COMMENT '所属站点ID（站点管理员必填，系统管理员为NULL）',
    `status`          tinyint                                                       NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    `last_login_time` datetime                                                      NULL     DEFAULT NULL COMMENT '最后登录时间',
    `last_login_ip`   varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '最后登录IP',
    `create_time`     datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`     datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`       bigint                                                        NULL     DEFAULT NULL COMMENT '创建人',
    `update_by`       bigint                                                        NULL     DEFAULT NULL COMMENT '更新人',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_username` (`username` ASC) USING BTREE,
    UNIQUE INDEX `uk_site_id` (`site_id` ASC) USING BTREE,
    INDEX `idx_role` (`role` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 3
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for attachments
-- ----------------------------
DROP TABLE IF EXISTS `attachments`;
CREATE TABLE `attachments`
(
    `id`             bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `site_id`        bigint                                                        NOT NULL DEFAULT 1 COMMENT '所属站点ID',
    `file_name`      varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件名',
    `file_url`       varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件URL',
    `file_size`      bigint                                                        NULL     DEFAULT NULL COMMENT '文件大小（字节）',
    `file_type`      varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '文件类型: video, image, file',
    `mime_type`      varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT 'MIME类型',
    `upload_user_id` bigint                                                        NULL     DEFAULT NULL COMMENT '上传用户ID',
    `created_at`     datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`     datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_file_type` (`file_type` ASC) USING BTREE,
    INDEX `idx_upload_user_id` (`upload_user_id` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 6
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '附件表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for characters
-- ----------------------------
DROP TABLE IF EXISTS `characters`;
CREATE TABLE `characters`
(
    `id`                  bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`             bigint                                                        NOT NULL COMMENT '用户ID',
    `site_id`             bigint                                                        NOT NULL DEFAULT 1 COMMENT '所属站点ID',
    `character_name`      varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '角色名称（用户自定义）',
    `character_id`        varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '第三方返回的角色ID',
    `generation_task_id`  varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '角色生成任务ID (用于回调查询)',
    `video_task_id`       varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '关联的视频生成任务ID (from_task参数)',
    `video_url`           varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '源视频URL (url参数)',
    `timestamps`          varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '角色出现的时间戳范围，格式: 起始秒,结束秒',
    `start_time`          decimal(10, 2)                                                NULL     DEFAULT NULL COMMENT '起始时间(秒)',
    `end_time`            decimal(10, 2)                                                NULL     DEFAULT NULL COMMENT '结束时间(秒)',
    `callback_url`        varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '回调地址',
    `status`              varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL DEFAULT 'pending' COMMENT '状态: pending, processing, completed, failed',
    `result_data`         json                                                          NULL COMMENT '角色生成结果数据',
    `character_image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '角色图片URL',
    `character_video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '角色视频片段URL',
    `error_message`       text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '错误信息',
    `is_real_person`      tinyint(1)                                                    NULL     DEFAULT 0 COMMENT '是否为真人: 0-否(from url), 1-是(from task)',
    `created_at`          datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`          datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `completed_at`        datetime                                                      NULL     DEFAULT NULL COMMENT '完成时间',
    `workflow_project_id` bigint                                                        NULL     DEFAULT NULL COMMENT '所属工作流项目ID',
    `character_type`      varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT 'character' COMMENT '角色类型：character-人物角色, scene-场景角色',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_project_character_name` (`workflow_project_id` ASC, `character_name` ASC) USING BTREE,
    INDEX `idx_user_id` (`user_id` ASC) USING BTREE,
    INDEX `idx_character_id` (`character_id` ASC) USING BTREE,
    INDEX `idx_video_task_id` (`video_task_id` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE,
    INDEX `idx_generation_task_id` (`generation_task_id` ASC) USING BTREE,
    INDEX `idx_character_name` (`character_name` ASC) USING BTREE,
    INDEX `idx_workflow_project_id` (`workflow_project_id` ASC) USING BTREE,
    INDEX `idx_character_type` (`character_type` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 15
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chat_records
-- ----------------------------
DROP TABLE IF EXISTS `chat_records`;
CREATE TABLE `chat_records`
(
    `id`                bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`           bigint                                                        NOT NULL COMMENT '用户ID',
    `model`             varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '模型名称',
    `scenario`          varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '聊天场景代码',
    `messages`          json                                                          NOT NULL COMMENT '消息列表 (JSON格式)',
    `request_params`    json                                                          NULL COMMENT '请求参数 (JSON格式)',
    `response_content`  text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '响应内容',
    `input_length`      int                                                           NULL     DEFAULT 0 COMMENT '输入文本长度',
    `output_length`     int                                                           NULL     DEFAULT 0 COMMENT '输出文本长度',
    `prompt_tokens`     int                                                           NULL     DEFAULT 0 COMMENT '提示词token数',
    `completion_tokens` int                                                           NULL     DEFAULT 0 COMMENT '完成token数',
    `total_tokens`      int                                                           NULL     DEFAULT 0 COMMENT '总token数',
    `status`            varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL DEFAULT 'success' COMMENT '状态: success, error',
    `error_message`     text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '错误信息',
    `request_time`      datetime                                                      NOT NULL COMMENT '请求时间',
    `response_time`     datetime                                                      NULL     DEFAULT NULL COMMENT '响应时间',
    `duration_ms`       int                                                           NULL     DEFAULT 0 COMMENT '耗时(毫秒)',
    `created_at`        datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`        datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_user_id` (`user_id` ASC) USING BTREE,
    INDEX `idx_model` (`model` ASC) USING BTREE,
    INDEX `idx_scenario` (`scenario` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE,
    INDEX `idx_request_time` (`request_time` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 69
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = 'AI聊天记录表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for image_generation_tasks
-- ----------------------------
DROP TABLE IF EXISTS `image_generation_tasks`;
CREATE TABLE `image_generation_tasks`
(
    `id`            int                                                                                                 NOT NULL AUTO_INCREMENT,
    `user_id`       int                                                                                                 NOT NULL COMMENT '用户ID',
    `site_id`       bigint                                                                                              NOT NULL DEFAULT 1 COMMENT '所属站点ID',
    `task_id`       varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                       NOT NULL COMMENT '第三方任务ID',
    `type`          enum ('text2image','image2image') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                  NOT NULL COMMENT '任务类型',
    `model`         varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                        NOT NULL COMMENT '使用的模型',
    `prompt`        text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                               NOT NULL COMMENT '提示词',
    `image_urls`    text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                               NULL COMMENT '参考图URLs(JSON格式)',
    `aspect_ratio`  varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                        NULL     DEFAULT 'auto' COMMENT '宽高比',
    `image_size`    varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                        NULL     DEFAULT '1K' COMMENT '分辨率',
    `status`        enum ('pending','processing','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT 'pending' COMMENT '任务状态',
    `result_url`    text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                               NULL COMMENT '生成的图片URL',
    `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                               NULL COMMENT '错误信息',
    `admin_remark`  varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci                                       NULL     DEFAULT NULL COMMENT '管理员备注',
    `created_at`    datetime                                                                                            NULL     DEFAULT NULL,
    `updated_at`    datetime                                                                                            NULL     DEFAULT NULL,
    `completed_at`  datetime                                                                                            NULL     DEFAULT NULL,
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_user_id` (`user_id` ASC) USING BTREE,
    INDEX `idx_task_id` (`task_id` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 26
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '图像生成任务表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for site
-- ----------------------------
DROP TABLE IF EXISTS `site`;
CREATE TABLE `site`
(
    `id`             bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `site_name`      varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '站点名称',
    `site_code`      varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '站点编码（唯一标识）',
    `domain`         varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '站点域名',
    `logo`           varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT 'Logo URL',
    `description`    varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '站点描述',
    `admin_username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '站点管理员账号',
    `status`         tinyint                                                       NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    `sort`           int                                                           NOT NULL DEFAULT 0 COMMENT '排序',
    `create_time`    datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`    datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by`      bigint                                                        NULL     DEFAULT NULL COMMENT '创建人',
    `update_by`      bigint                                                        NULL     DEFAULT NULL COMMENT '更新人',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_site_code` (`site_code` ASC) USING BTREE,
    UNIQUE INDEX `uk_admin_username` (`admin_username` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 2
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '站点表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for site_config
-- ----------------------------
DROP TABLE IF EXISTS `site_config`;
CREATE TABLE `site_config`
(
    `id`           bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键',
    `site_id`      bigint                                                        NOT NULL COMMENT '站点ID',
    `config_key`   varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
    `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '配置值(敏感信息加密存储)',
    `config_type`  varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '配置类型: api_key/cos/system',
    `description`  varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '配置描述',
    `is_encrypted` tinyint                                                       NOT NULL DEFAULT 0 COMMENT '是否加密: 0-否 1-是',
    `create_time`  datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time`  datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_site_config` (`site_id` ASC, `config_key` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE,
    INDEX `idx_config_type` (`config_type` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 3
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '站点配置表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`
(
    `id`              int                                                           NOT NULL AUTO_INCREMENT,
    `site_id`         bigint                                                        NOT NULL DEFAULT 1 COMMENT '所属站点ID',
    `username`        varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL COMMENT '账户名',
    `password`        varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码',
    `status`          tinyint                                                       NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-正常 2-封禁',
    `ban_reason`      varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '封禁原因',
    `ban_time`        datetime                                                      NULL     DEFAULT NULL COMMENT '封禁时间',
    `last_login_time` datetime                                                      NULL     DEFAULT NULL COMMENT '最后登录时间',
    `last_login_ip`   varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '最后登录IP',
    `nickname`        varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '昵称',
    `email`           varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '邮箱',
    `phone`           varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT NULL COMMENT '手机号',
    `points`          int                                                           NULL     DEFAULT 0 COMMENT '积分',
    `role`            varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT 'user' COMMENT '用户角色(user/member/admin)',
    `app_id`          varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT 'default' COMMENT '应用ID',
    `created_at`      timestamp                                                     NULL     DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`      timestamp                                                     NULL     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `unique_username` (`username` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 9
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for video_generation_tasks
-- ----------------------------
DROP TABLE IF EXISTS `video_generation_tasks`;
CREATE TABLE `video_generation_tasks`
(
    `id`            bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       bigint                                                        NOT NULL COMMENT '用户ID',
    `site_id`       bigint                                                        NOT NULL DEFAULT 1 COMMENT '所属站点ID',
    `task_id`       varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '第三方任务ID',
    `model`         varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '模型名称: sora-2, sora-2-pro',
    `prompt`        text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NOT NULL COMMENT '提示词',
    `image_urls`    json                                                          NULL COMMENT '参考图URLs (JSON数组)',
    `aspect_ratio`  varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NULL     DEFAULT '16:9' COMMENT '视频宽高比: 16:9, 9:16',
    `duration`      int                                                           NULL     DEFAULT 10 COMMENT '视频时长(秒): 10, 15, 25',
    `characters`    text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '多角色客串配置 (JSON格式)',
    `callback_url`  varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '回调地址',
    `status`        varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci  NOT NULL DEFAULT 'pending' COMMENT '状态: pending, running, succeeded, error',
    `result_url`    varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '生成结果视频URL',
    `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '错误信息',
    `admin_remark`  varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '管理员备注',
    `progress`      int                                                           NULL     DEFAULT 0 COMMENT '任务进度(0-100)',
    `created_at`    datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`    datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `completed_at`  datetime                                                      NULL     DEFAULT NULL COMMENT '完成时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_user_id` (`user_id` ASC) USING BTREE,
    INDEX `idx_task_id` (`task_id` ASC) USING BTREE,
    INDEX `idx_status` (`status` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 47
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '视频生成任务表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for workflow_project_characters
-- ----------------------------
DROP TABLE IF EXISTS `workflow_project_characters`;
CREATE TABLE `workflow_project_characters`
(
    `id`                  bigint   NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `workflow_project_id` bigint   NOT NULL COMMENT '工作流项目ID',
    `character_id`        bigint   NOT NULL COMMENT '角色ID',
    `usage_count`         int      NULL     DEFAULT 0 COMMENT '使用次数',
    `last_used_at`        datetime NULL     DEFAULT NULL COMMENT '最后使用时间',
    `created_at`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `uk_project_character` (`workflow_project_id` ASC, `character_id` ASC) USING BTREE,
    INDEX `idx_workflow_project_id` (`workflow_project_id` ASC) USING BTREE,
    INDEX `idx_character_id` (`character_id` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE,
    CONSTRAINT `fk_wpc_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
    CONSTRAINT `fk_wpc_workflow_project` FOREIGN KEY (`workflow_project_id`) REFERENCES `workflow_projects` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB
  AUTO_INCREMENT = 12
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '工作流项目与角色关联表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for workflow_projects
-- ----------------------------
DROP TABLE IF EXISTS `workflow_projects`;
CREATE TABLE `workflow_projects`
(
    `id`             bigint                                                        NOT NULL AUTO_INCREMENT COMMENT '项目ID',
    `user_id`        bigint                                                        NOT NULL COMMENT '用户ID',
    `site_id`        bigint                                                        NOT NULL DEFAULT 1 COMMENT '所属站点ID',
    `name`           varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '项目名称',
    `description`    text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci         NULL COMMENT '项目描述',
    `thumbnail`      varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL     DEFAULT NULL COMMENT '缩略图URL',
    `workflow_data`  json                                                          NOT NULL COMMENT '工作流完整数据',
    `node_count`     int                                                           NULL     DEFAULT 0 COMMENT '节点数量',
    `last_opened_at` datetime                                                      NULL     DEFAULT NULL COMMENT '最后打开时间',
    `created_at`     datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`     datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_user_id` (`user_id` ASC) USING BTREE,
    INDEX `idx_created_at` (`created_at` ASC) USING BTREE,
    INDEX `idx_updated_at` (`updated_at` ASC) USING BTREE,
    INDEX `idx_site_id` (`site_id` ASC) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 4
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci COMMENT = '工作流项目表'
  ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
