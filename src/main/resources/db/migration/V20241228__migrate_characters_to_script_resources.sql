-- 迁移 characters 表数据到 script_resources 表
-- 执行时间: 2024-12-28
-- 描述: 将现有的角色和场景数据迁移到统一的剧本资源表

-- 迁移视频角色数据（现有 characters 表中的 character_type='character' 的数据）
INSERT INTO `script_resources` (`user_id`, `site_id`, `script_id`, `workflow_project_id`,
                                `resource_type`, `resource_name`, `resource_category`,
                                `status`, `error_message`, `created_at`, `updated_at`, `completed_at`,
                                `resource_details`)
SELECT `user_id`,
       `site_id`,
       `script_id`,
       `workflow_project_id`,
       'video_character',
       COALESCE(`character_name`, '未命名角色'),
       'character',
       `status`,
       `error_message`,
       `created_at`,
       `updated_at`,
       `completed_at`,
       JSON_OBJECT(
               'videoCharacterId', `character_id`,
               'generationTaskId', `generation_task_id`,
               'videoTaskId', `video_task_id`,
               'videoUrl', `video_url`,
               'timestamps', `timestamps`,
               'startTime', `start_time`,
               'endTime', `end_time`,
               'characterImageUrl', `character_image_url`,
               'characterVideoUrl', `character_video_url`,
               'isRealPerson', `is_real_person`,
               'resultData', `result_data`
       )
FROM `characters`
WHERE `character_type` = 'character';

-- 迁移视频场景数据（现有 characters 表中的 character_type='scene' 的数据）
INSERT INTO `script_resources` (`user_id`, `site_id`, `script_id`, `workflow_project_id`,
                                `resource_type`, `resource_name`, `resource_category`,
                                `status`, `error_message`, `created_at`, `updated_at`, `completed_at`,
                                `resource_details`)
SELECT `user_id`,
       `site_id`,
       `script_id`,
       `workflow_project_id`,
       'video_scene',
       COALESCE(`character_name`, '未命名场景'),
       'scene',
       `status`,
       `error_message`,
       `created_at`,
       `updated_at`,
       `completed_at`,
       JSON_OBJECT(
               'videoSceneId', `character_id`,
               'generationTaskId', `generation_task_id`,
               'videoTaskId', `video_task_id`,
               'videoUrl', `video_url`,
               'timestamps', `timestamps`,
               'startTime', `start_time`,
               'endTime', `end_time`,
               'resultData', `result_data`
       )
FROM `characters`
WHERE `character_type` = 'scene';
