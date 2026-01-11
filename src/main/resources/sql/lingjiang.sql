/*
 Navicat Premium Dump SQL

 Source Server         : lingjiang
 Source Server Type    : MySQL
 Source Server Version : 80405 (8.4.5)
 Source Host           : 43.143.57.153:3306
 Source Schema         : lingjiang

 Target Server Type    : MySQL
 Target Server Version : 80405 (8.4.5)
 File Encoding         : 65001

 Date: 11/01/2026 15:25:46
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for admin_login_log
-- ----------------------------
DROP TABLE IF EXISTS `admin_login_log`;
CREATE TABLE `admin_login_log`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `admin_id` bigint NULL DEFAULT NULL COMMENT '管理员ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用户名',
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登录IP',
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'IP归属地',
  `browser` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '浏览器',
  `os` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作系统',
  `status` tinyint NOT NULL COMMENT '状态: 0-失败 1-成功',
  `message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '提示消息',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建人ID',
  `updated_by` bigint NULL DEFAULT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_admin_id`(`admin_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 76 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员登录日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for admin_operation_log
-- ----------------------------
DROP TABLE IF EXISTS `admin_operation_log`;
CREATE TABLE `admin_operation_log`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `admin_id` bigint NOT NULL COMMENT '管理员ID',
  `admin_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '管理员名称',
  `site_id` bigint NULL DEFAULT NULL COMMENT '站点ID',
  `module` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作模块',
  `operation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作类型',
  `method` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '请求方法',
  `params` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '请求参数',
  `result` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '返回结果',
  `ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作IP',
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'IP归属地',
  `user_agent` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '用户代理',
  `status` tinyint NOT NULL COMMENT '状态: 0-失败 1-成功',
  `error_msg` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `cost_time` int NULL DEFAULT NULL COMMENT '耗时(ms)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建人ID',
  `updated_by` bigint NULL DEFAULT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_admin_id`(`admin_id` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_module`(`module` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 125 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员操作日志表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for admin_user
-- ----------------------------
DROP TABLE IF EXISTS `admin_user`;
CREATE TABLE `admin_user`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '用户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码(BCrypt加密)',
  `real_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '真实姓名',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像',
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色: SYSTEM_ADMIN-系统管理员 SITE_ADMIN-站点管理员',
  `site_id` bigint NULL DEFAULT NULL COMMENT '所属站点ID（站点管理员必填，系统管理员为NULL）',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `last_login_time` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后登录IP',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建人ID',
  `updated_by` bigint NULL DEFAULT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `uk_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_role`(`role` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '管理员表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for attachments
-- ----------------------------
DROP TABLE IF EXISTS `attachments`;
CREATE TABLE `attachments`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `site_id` bigint NOT NULL DEFAULT 1 COMMENT '所属站点ID',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件名',
  `file_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件URL',
  `file_size` bigint NULL DEFAULT NULL COMMENT '文件大小（字节）',
  `file_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '文件类型: video, image, file',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'MIME类型',
  `upload_user_id` bigint NULL DEFAULT NULL COMMENT '上传用户ID',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_file_type`(`file_type` ASC) USING BTREE,
  INDEX `idx_upload_user_id`(`upload_user_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 177 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '附件表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for card_key
-- ----------------------------
DROP TABLE IF EXISTS `card_key`;
CREATE TABLE `card_key`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `site_id` bigint NOT NULL COMMENT '所属站点ID',
  `card_code` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '卡密码（唯一）',
  `points` int NOT NULL DEFAULT 0 COMMENT '积分值',
  `status` tinyint NOT NULL DEFAULT 0 COMMENT '状态: 0-未使用 1-已使用 2-已禁用',
  `batch_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '批次号',
  `used_by` bigint NULL DEFAULT NULL COMMENT '使用者用户ID',
  `used_at` datetime NULL DEFAULT NULL COMMENT '使用时间',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `expired_at` datetime NULL DEFAULT NULL COMMENT '过期时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建人ID',
  `updated_by` bigint NULL DEFAULT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_card_code`(`card_code` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_batch_no`(`batch_no` ASC) USING BTREE,
  INDEX `idx_used_by`(`used_by` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 11 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '卡密表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for character_project_resources
-- ----------------------------
DROP TABLE IF EXISTS `character_project_resources`;
CREATE TABLE `character_project_resources`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `project_id` bigint NOT NULL COMMENT '角色项目ID',
  `resource_id` bigint NOT NULL COMMENT '资源ID（关联 video_resources.id）',
  `source_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'extract' COMMENT '来源类型：extract-提取创建，script-剧本选择',
  `source_script_id` bigint NULL DEFAULT NULL COMMENT '来源剧本ID（source_type=script 时有值）',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序顺序',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_project_resource`(`project_id` ASC, `resource_id` ASC) USING BTREE,
  INDEX `idx_project_id`(`project_id` ASC) USING BTREE,
  INDEX `idx_resource_id`(`resource_id` ASC) USING BTREE,
  INDEX `idx_source_script_id`(`source_script_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 48 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色项目资源关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for character_project_storyboard_resources
-- ----------------------------
DROP TABLE IF EXISTS `character_project_storyboard_resources`;
CREATE TABLE `character_project_storyboard_resources`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `storyboard_id` bigint NOT NULL COMMENT '分镜ID',
  `resource_id` bigint NOT NULL COMMENT '资源ID（关联 video_resources.id）',
  `resource_role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '资源在分镜中的角色：main_character-主角，supporting-配角，scene-场景，prop-道具',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序顺序',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_storyboard_resource`(`storyboard_id` ASC, `resource_id` ASC) USING BTREE,
  INDEX `idx_storyboard_id`(`storyboard_id` ASC) USING BTREE,
  INDEX `idx_resource_id`(`resource_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '分镜资源关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for character_project_storyboard_videos
-- ----------------------------
DROP TABLE IF EXISTS `character_project_storyboard_videos`;
CREATE TABLE `character_project_storyboard_videos`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `storyboard_id` bigint NOT NULL COMMENT '分镜ID',
  `project_id` bigint NOT NULL COMMENT '角色项目ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL COMMENT '站点ID',
  `video_task_id` bigint NULL DEFAULT NULL COMMENT '视频生成任务ID',
  `task_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '外部任务ID',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '生成的视频URL',
  `prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '使用的提示词',
  `aspect_ratio` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '16:9' COMMENT '视频宽高比',
  `duration` int NULL DEFAULT 15 COMMENT '视频时长（秒）',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态：pending/generating/completed/failed',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序序号',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_storyboard_id`(`storyboard_id` ASC) USING BTREE,
  INDEX `idx_project_id`(`project_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色项目分镜视频表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for character_project_storyboards
-- ----------------------------
DROP TABLE IF EXISTS `character_project_storyboards`;
CREATE TABLE `character_project_storyboards`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `project_id` bigint NOT NULL COMMENT '角色项目ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL COMMENT '站点ID',
  `scene_number` int NOT NULL COMMENT '分镜序号',
  `scene_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '分镜名称',
  `scene_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '分镜描述',
  `video_prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `video_task_id` bigint NULL DEFAULT NULL COMMENT '视频生成任务ID（关联 video_generation_tasks）',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '生成的视频URL',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '状态：pending/generating/completed/failed',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_project_id`(`project_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_scene_number`(`scene_number` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色项目分镜表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for character_projects
-- ----------------------------
DROP TABLE IF EXISTS `character_projects`;
CREATE TABLE `character_projects`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL COMMENT '站点ID',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '项目名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '项目描述',
  `script_id` bigint NULL DEFAULT NULL COMMENT '关联剧本ID',
  `style` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '风格',
  `script_content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '剧本内容',
  `current_step` int NULL DEFAULT 1 COMMENT '当前步骤：1-输入剧本，2-提取资源，3-分镜创作',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'draft' COMMENT '项目状态：draft/in_progress/completed',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_script_id`(`script_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色项目表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for characters
-- ----------------------------
DROP TABLE IF EXISTS `characters`;
CREATE TABLE `characters`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL DEFAULT 1 COMMENT '所属站点ID',
  `script_id` bigint NULL DEFAULT NULL COMMENT '所属剧本ID',
  `character_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色名称（用户自定义）',
  `character_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '第三方返回的角色ID',
  `generation_task_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色生成任务ID (用于回调查询)',
  `video_task_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '关联的视频生成任务ID (from_task参数)',
  `video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '源视频URL (url参数)',
  `timestamps` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '角色出现的时间戳范围，格式: 起始秒,结束秒',
  `start_time` decimal(10, 2) NULL DEFAULT NULL COMMENT '起始时间(秒)',
  `end_time` decimal(10, 2) NULL DEFAULT NULL COMMENT '结束时间(秒)',
  `callback_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '回调地址',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '状态: pending, processing, completed, failed',
  `result_data` json NULL COMMENT '角色生成结果数据',
  `character_image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色图片URL',
  `character_video_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色视频片段URL',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `is_real_person` tinyint(1) NULL DEFAULT 0 COMMENT '是否为真人: 0-否(from url), 1-是(from task)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `completed_at` datetime NULL DEFAULT NULL COMMENT '完成时间',
  `workflow_project_id` bigint NULL DEFAULT NULL COMMENT '所属工作流项目ID',
  `character_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'character' COMMENT '角色类型：character-人物角色, scene-场景角色',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_project_character_name`(`workflow_project_id` ASC, `character_name` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_character_id`(`character_id` ASC) USING BTREE,
  INDEX `idx_video_task_id`(`video_task_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_generation_task_id`(`generation_task_id` ASC) USING BTREE,
  INDEX `idx_character_name`(`character_name` ASC) USING BTREE,
  INDEX `idx_workflow_project_id`(`workflow_project_id` ASC) USING BTREE,
  INDEX `idx_character_type`(`character_type` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_script_id`(`script_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 265 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '角色表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chat_prompts
-- ----------------------------
DROP TABLE IF EXISTS `chat_prompts`;
CREATE TABLE `chat_prompts`  (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '场景编码（唯一标识）',
  `label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '场景名称',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '场景描述',
  `system_prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '系统提示词',
  `default_temperature` decimal(3, 2) NULL DEFAULT 0.70 COMMENT '默认温度',
  `default_max_tokens` int NULL DEFAULT 2048 COMMENT '默认最大token数',
  `is_enabled` tinyint NULL DEFAULT 1 COMMENT '是否启用：0-禁用，1-启用',
  `sort_order` int NULL DEFAULT 0 COMMENT '排序顺序',
  `created_at` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` bigint NULL DEFAULT NULL,
  `updated_by` bigint NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_code`(`code` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 21 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'AI聊天提示词配置' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for chat_records
-- ----------------------------
DROP TABLE IF EXISTS `chat_records`;
CREATE TABLE `chat_records`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '模型名称',
  `scenario` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '聊天场景代码',
  `messages` json NOT NULL COMMENT '消息列表 (JSON格式)',
  `request_params` json NULL COMMENT '请求参数 (JSON格式)',
  `response_content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '响应内容',
  `input_length` int NULL DEFAULT 0 COMMENT '输入文本长度',
  `output_length` int NULL DEFAULT 0 COMMENT '输出文本长度',
  `prompt_tokens` int NULL DEFAULT 0 COMMENT '提示词token数',
  `completion_tokens` int NULL DEFAULT 0 COMMENT '完成token数',
  `total_tokens` int NULL DEFAULT 0 COMMENT '总token数',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'success' COMMENT '状态: success, error',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `request_time` datetime NOT NULL COMMENT '请求时间',
  `response_time` datetime NULL DEFAULT NULL COMMENT '响应时间',
  `duration_ms` int NULL DEFAULT 0 COMMENT '耗时(毫秒)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_model`(`model` ASC) USING BTREE,
  INDEX `idx_scenario`(`scenario` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_request_time`(`request_time` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1402 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = 'AI聊天记录表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for image_generation_tasks
-- ----------------------------
DROP TABLE IF EXISTS `image_generation_tasks`;
CREATE TABLE `image_generation_tasks`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL DEFAULT 1 COMMENT '所属站点ID',
  `task_id` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '第三方任务ID',
  `type` enum('text2image','image2image') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '任务类型',
  `model` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '使用的模型',
  `prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '提示词',
  `image_urls` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '参考图URLs(JSON格式)',
  `aspect_ratio` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'auto' COMMENT '宽高比',
  `image_size` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '1K' COMMENT '分辨率',
  `status` enum('pending','processing','completed','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending' COMMENT '任务状态',
  `result_url` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '生成的图片URL',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `admin_remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '管理员备注',
  `created_at` datetime NULL DEFAULT NULL,
  `updated_at` datetime NULL DEFAULT NULL,
  `completed_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_task_id`(`task_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1294 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '图像生成任务表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for picture_resources
-- ----------------------------
DROP TABLE IF EXISTS `picture_resources`;
CREATE TABLE `picture_resources`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL COMMENT '站点ID',
  `project_id` bigint NULL DEFAULT NULL COMMENT '项目ID',
  `script_id` bigint NULL DEFAULT NULL COMMENT '剧本ID',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资源名称',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资源类型：character-角色, scene-场景, prop-道具, skill-技能',
  `image_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '图片地址',
  `prompt` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '提示词',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'generated' COMMENT '状态：pending-未生成, generating-生成中, generated-已生成',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_script_id`(`script_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_script_type`(`script_id` ASC, `type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_script_status`(`script_id` ASC, `status` ASC) USING BTREE,
  INDEX `idx_project_id`(`project_id` ASC) USING BTREE,
  INDEX `idx_project_type`(`project_id` ASC, `type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 124 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '图片资源表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for points_config
-- ----------------------------
DROP TABLE IF EXISTS `points_config`;
CREATE TABLE `points_config`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
  `config_value` int NOT NULL DEFAULT 0 COMMENT '消耗积分值',
  `config_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置名称',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '描述',
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用: 0-禁用 1-启用',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_site_key`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '积分配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for points_record
-- ----------------------------
DROP TABLE IF EXISTS `points_record`;
CREATE TABLE `points_record`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `site_id` bigint NOT NULL COMMENT '所属站点ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `type` tinyint NOT NULL COMMENT '类型: 1-收入 2-支出',
  `points` int NOT NULL COMMENT '积分变动值（正数）',
  `balance` int NOT NULL COMMENT '变动后余额',
  `source` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '来源: card_key-卡密兑换 admin_adjust-管理员调整 task_consume-任务消耗 register-注册赠送',
  `source_id` bigint NULL DEFAULT NULL COMMENT '来源关联ID（如卡密ID、任务ID等）',
  `remark` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '备注',
  `operator_id` bigint NULL DEFAULT NULL COMMENT '操作人ID（管理员调整时记录）',
  `operator_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '操作人名称',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  INDEX `idx_source`(`source` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4878 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '积分记录表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for script_members
-- ----------------------------
DROP TABLE IF EXISTS `script_members`;
CREATE TABLE `script_members`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `script_id` bigint NOT NULL COMMENT '剧本ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `role` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'member' COMMENT '角色: creator-创建者, member-成员',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_script_user`(`script_id` ASC, `user_id` ASC) USING BTREE COMMENT '剧本用户唯一索引',
  INDEX `idx_script_id`(`script_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 31 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '剧本成员关联表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for scripts
-- ----------------------------
DROP TABLE IF EXISTS `scripts`;
CREATE TABLE `scripts`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '剧本ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL DEFAULT 1 COMMENT '所属站点ID',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '剧本名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '剧本描述',
  `cover_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封面图URL',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'active' COMMENT '状态: active-活跃, archived-归档',
  `style` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '剧本风格',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_style`(`style` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 25 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '剧本表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for site
-- ----------------------------
DROP TABLE IF EXISTS `site`;
CREATE TABLE `site`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `site_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '站点名称',
  `site_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '站点编码（唯一标识）',
  `domain` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '站点域名',
  `logo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'Logo URL',
  `description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '站点描述',
  `admin_username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '站点管理员账号',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `sort` int NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建人ID',
  `updated_by` bigint NULL DEFAULT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_site_code`(`site_code` ASC) USING BTREE,
  UNIQUE INDEX `uk_admin_username`(`admin_username` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '站点表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for site_config
-- ----------------------------
DROP TABLE IF EXISTS `site_config`;
CREATE TABLE `site_config`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `site_id` bigint NOT NULL COMMENT '站点ID',
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置键',
  `config_value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '配置值(敏感信息加密存储)',
  `config_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '配置类型: api_key/cos/system',
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '配置描述',
  `is_encrypted` tinyint NOT NULL DEFAULT 0 COMMENT '是否加密: 0-否 1-是',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建人ID',
  `updated_by` bigint NULL DEFAULT NULL COMMENT '更新人ID',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_site_config`(`site_id` ASC, `config_key` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_config_type`(`config_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 26 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '站点配置表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for system_config
-- ----------------------------
DROP TABLE IF EXISTS `system_config`;
CREATE TABLE `system_config`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `system_title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '系统标题',
  `system_logo` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '系统Logo URL',
  `system_favicon` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '系统Favicon URL',
  `copyright` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '版权信息',
  `footer_text` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '页脚文字',
  `icp_beian` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT 'ICP备案号',
  `login_bg_image` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登录页背景图URL',
  `login_title` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登录页标题',
  `login_subtitle` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '登录页副标题',
  `primary_color` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '主题色',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `created_by` bigint NULL DEFAULT NULL COMMENT '创建人',
  `updated_by` bigint NULL DEFAULT NULL COMMENT '更新人',
  `image_concurrency_limit` int NULL DEFAULT 10 COMMENT '图片生成并发任务数限制，0表示不限制',
  `video_concurrency_limit` int NULL DEFAULT 5 COMMENT '视频生成并发任务数限制，0表示不限制',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '系统配置表' ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `site_id` bigint NOT NULL DEFAULT 1 COMMENT '所属站点ID',
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '账户名',
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '密码',
  `status` tinyint NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-正常 2-封禁',
  `ban_reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '封禁原因',
  `ban_time` datetime NULL DEFAULT NULL COMMENT '封禁时间',
  `last_login_time` datetime NULL DEFAULT NULL COMMENT '最后登录时间',
  `last_login_ip` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '最后登录IP',
  `nickname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '昵称',
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '邮箱',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL',
  `points` int NULL DEFAULT 0 COMMENT '积分',
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'user' COMMENT '用户角色(user/member/admin)',
  `app_id` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'default' COMMENT '应用ID',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_username_site`(`username` ASC, `site_id` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 29 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '用户表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for video_generation_tasks
-- ----------------------------
DROP TABLE IF EXISTS `video_generation_tasks`;
CREATE TABLE `video_generation_tasks`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL DEFAULT 1 COMMENT '所属站点ID',
  `task_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '第三方任务ID',
  `model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '模型名称: sora-2, sora-2-pro',
  `prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '提示词',
  `image_urls` json NULL COMMENT '参考图URLs (JSON数组)',
  `aspect_ratio` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '16:9' COMMENT '视频宽高比: 16:9, 9:16',
  `duration` int NULL DEFAULT 10 COMMENT '视频时长(秒): 10, 15, 25',
  `characters` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '多角色客串配置 (JSON格式)',
  `callback_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '回调地址',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'pending' COMMENT '状态: pending, running, succeeded, error',
  `result_url` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '生成结果视频URL',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `admin_remark` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '管理员备注',
  `progress` int NULL DEFAULT 0 COMMENT '任务进度(0-100)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `completed_at` datetime NULL DEFAULT NULL COMMENT '完成时间',
  `project_id` bigint NULL DEFAULT NULL COMMENT '关联的工作 流项目ID',
  `character_project_id` bigint NULL DEFAULT NULL COMMENT '角色项目ID',
  `storyboard_id` bigint NULL DEFAULT NULL COMMENT '分镜ID',
  `script_id` bigint NULL DEFAULT NULL COMMENT '关联的剧本ID',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_task_id`(`task_id` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_character_project_id`(`character_project_id` ASC) USING BTREE,
  INDEX `idx_storyboard_id`(`storyboard_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 3617 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '视频生成任务表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for video_resources
-- ----------------------------
DROP TABLE IF EXISTS `video_resources`;
CREATE TABLE `video_resources`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL COMMENT '站点ID',
  `script_id` bigint NULL DEFAULT NULL COMMENT '剧本ID',
  `workflow_project_id` bigint NULL DEFAULT NULL COMMENT '工作流项目ID',
  `resource_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '资源名称',
  `resource_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'character' COMMENT '资源类型: character-人物, scene-场景, prop-道具, skill-技能',
  `prompt` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '资源描述/提示词',
  `video_task_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '视频生成任务ID',
  `video_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '源视频URL',
  `video_result_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '生成的视频结果URL',
  `aspect_ratio` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '视频比例',
  `start_time` decimal(10, 3) NULL DEFAULT NULL COMMENT '视频截取开始时间(秒)',
  `end_time` decimal(10, 3) NULL DEFAULT NULL COMMENT '视频截取结束时间(秒)',
  `timestamps` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '时间戳范围，格式: 起始秒,结束秒',
  `generation_task_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色生成任务ID',
  `character_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '生成的角色ID',
  `character_image_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色图片URL',
  `character_video_url` varchar(1024) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '角色视频URL',
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'not_generated' COMMENT '状态: not_generated-未生成, pending-待处理, processing-处理中, completed-已完成, failed-失败',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '错误信息',
  `is_real_person` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否真人角色',
  `result_data` json NULL COMMENT '回调结果数据',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `completed_at` datetime NULL DEFAULT NULL COMMENT '完成时间',
  `character_requested_at` datetime NULL DEFAULT NULL COMMENT '角色创建请求时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_script_id`(`script_id` ASC) USING BTREE,
  INDEX `idx_project_id`(`workflow_project_id` ASC) USING BTREE,
  INDEX `idx_resource_type`(`resource_type` ASC) USING BTREE,
  INDEX `idx_status`(`status` ASC) USING BTREE,
  INDEX `idx_generation_task_id`(`generation_task_id` ASC) USING BTREE,
  INDEX `idx_video_task_id`(`video_task_id` ASC) USING BTREE,
  INDEX `idx_user_site`(`user_id` ASC, `site_id` ASC) USING BTREE,
  INDEX `idx_script_type`(`script_id` ASC, `resource_type` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 514 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '视频资源表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for workflow_project_characters
-- ----------------------------
DROP TABLE IF EXISTS `workflow_project_characters`;
CREATE TABLE `workflow_project_characters`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `workflow_project_id` bigint NOT NULL COMMENT '工作流项目ID',
  `character_id` bigint NOT NULL COMMENT '角色ID',
  `usage_count` int NULL DEFAULT 0 COMMENT '使用次数',
  `last_used_at` datetime NULL DEFAULT NULL COMMENT '最后使用时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_project_character`(`workflow_project_id` ASC, `character_id` ASC) USING BTREE,
  INDEX `idx_workflow_project_id`(`workflow_project_id` ASC) USING BTREE,
  INDEX `idx_character_id`(`character_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  CONSTRAINT `fk_wpc_character` FOREIGN KEY (`character_id`) REFERENCES `characters` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_wpc_workflow_project` FOREIGN KEY (`workflow_project_id`) REFERENCES `workflow_projects` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 12 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工作流项目与角色关联表' ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for workflow_projects
-- ----------------------------
DROP TABLE IF EXISTS `workflow_projects`;
CREATE TABLE `workflow_projects`  (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `user_id` bigint NOT NULL COMMENT '用户ID',
  `site_id` bigint NOT NULL DEFAULT 1 COMMENT '所属站点ID',
  `script_id` bigint NULL DEFAULT NULL COMMENT '关联的剧本ID',
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT '项目名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL COMMENT '项目描述',
  `thumbnail` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '缩略图URL',
  `workflow_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'character-resource' COMMENT '工作流类型: character-resource(角色资源), storyboard(分镜图)',
  `style` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '项目风格',
  `workflow_data` json NOT NULL COMMENT '工作流完整数据',
  `node_count` int NULL DEFAULT 0 COMMENT '节点数量',
  `last_opened_at` datetime NULL DEFAULT NULL COMMENT '最后打开时间',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_updated_at`(`updated_at` ASC) USING BTREE,
  INDEX `idx_site_id`(`site_id` ASC) USING BTREE,
  INDEX `idx_script_id`(`script_id` ASC) USING BTREE,
  INDEX `idx_workflow_type`(`workflow_type` ASC) USING BTREE,
  INDEX `idx_style`(`style` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 104 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci COMMENT = '工作流项目表' ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
