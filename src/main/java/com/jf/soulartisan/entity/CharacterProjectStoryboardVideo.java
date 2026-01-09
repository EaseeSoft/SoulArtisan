package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 角色项目分镜视频实体
 * 一个分镜可以生成多条视频
 */
@Data
@TableName(value = "character_project_storyboard_videos", autoResultMap = true)
public class CharacterProjectStoryboardVideo {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 分镜ID
     */
    private Long storyboardId;

    /**
     * 角色项目ID
     */
    private Long projectId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 站点ID
     */
    private Long siteId;

    /**
     * 视频生成任务ID（关联 video_generation_tasks）
     */
    private Long videoTaskId;

    /**
     * 外部任务ID
     */
    private String taskId;

    /**
     * 生成的视频URL
     */
    private String videoUrl;

    /**
     * 使用的提示词
     */
    private String prompt;

    /**
     * 视频宽高比
     */
    private String aspectRatio;

    /**
     * 视频时长（秒）
     */
    private Integer duration;

    /**
     * 状态：pending/generating/completed/failed
     */
    private String status;

    /**
     * 错误信息
     */
    private String errorMessage;

    /**
     * 排序序号
     */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 状态常量
     */
    public static class Status {
        public static final String PENDING = "pending";
        public static final String GENERATING = "generating";
        public static final String COMPLETED = "completed";
        public static final String FAILED = "failed";
    }
}
