package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 角色项目分镜实体
 */
@Data
@TableName(value = "character_project_storyboards", autoResultMap = true)
public class CharacterProjectStoryboard {

    @TableId(type = IdType.AUTO)
    private Long id;

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
     * 分镜序号
     */
    private Integer sceneNumber;

    /**
     * 分镜名称
     */
    private String sceneName;

    /**
     * 分镜描述（包含 @characterId 引用）
     */
    private String sceneDescription;

    /**
     * 视频提示词（用于视频生成）
     */
    private String videoPrompt;

    /**
     * 视频生成任务ID（关联 video_generation_tasks）- 已弃用，使用 storyboard_videos 表
     */
    @Deprecated
    private Long videoTaskId;

    /**
     * 生成的视频URL
     */
    private String videoUrl;

    /**
     * 状态：pending/generating/completed/failed
     */
    private String status;

    /**
     * 错误信息
     */
    private String errorMessage;

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
