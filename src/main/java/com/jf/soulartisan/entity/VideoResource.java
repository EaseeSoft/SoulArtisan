package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 视频资源实体
 * 支持从剧本创建资源→生成视频→提取角色的完整流程
 */
@Data
@TableName(value = "video_resources", autoResultMap = true)
public class VideoResource {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 站点ID
     */
    private Long siteId;

    /**
     * 剧本ID
     */
    private Long scriptId;

    /**
     * 工作流项目ID
     */
    private Long workflowProjectId;

    /**
     * 资源名称
     */
    private String resourceName;

    /**
     * 资源类型: character-人物, scene-场景, prop-道具, skill-技能
     */
    private String resourceType;

    /**
     * 资源描述/提示词
     */
    private String prompt;

    /**
     * 视频尺寸: 16:9-横版, 9:16-竖版
     * 角色类型默认竖版，其他类型默认横版
     */
    private String aspectRatio;

    /**
     * 视频生成任务ID
     */
    private String videoTaskId;

    /**
     * 源视频URL
     */
    private String videoUrl;

    /**
     * 生成的视频结果URL
     */
    private String videoResultUrl;

    /**
     * 视频截取开始时间(秒)
     */
    private BigDecimal startTime;

    /**
     * 视频截取结束时间(秒)
     */
    private BigDecimal endTime;

    /**
     * 时间戳范围，格式: 起始秒,结束秒
     */
    private String timestamps;

    /**
     * 角色生成任务ID
     */
    private String generationTaskId;

    /**
     * 生成的角色ID
     */
    private String characterId;

    /**
     * 角色图片URL
     */
    private String characterImageUrl;

    /**
     * 角色视频URL
     */
    private String characterVideoUrl;

    /**
     * 状态: not_generated-未生成, video_generating-视频生成中, video_generated-视频已生成, character_generating-角色生成中, completed-已完成, failed-失败
     * 流转顺序: not_generated → video_generating → video_generated → character_generating → completed
     */
    private String status;

    /**
     * 错误信息
     */
    private String errorMessage;

    /**
     * 是否真人角色
     */
    private Boolean isRealPerson;

    /**
     * 回调结果数据
     */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Object resultData;

    /**
     * 角色创建请求时间
     * 用于超时重试判断（超过5分钟允许重新提交）
     */
    private LocalDateTime characterRequestedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    /**
     * 状态常量
     * 流转顺序: NOT_GENERATED → VIDEO_GENERATING → VIDEO_GENERATED → CHARACTER_GENERATING → COMPLETED
     */
    public static class Status {
        /**
         * 未生成（初始状态）
         */
        public static final String NOT_GENERATED = "not_generated";
        /**
         * 视频生成中
         */
        public static final String VIDEO_GENERATING = "video_generating";
        /**
         * 视频已生成
         */
        public static final String VIDEO_GENERATED = "video_generated";
        /**
         * 角色生成中
         */
        public static final String CHARACTER_GENERATING = "character_generating";
        /**
         * 已完成
         */
        public static final String COMPLETED = "completed";
        /**
         * 失败
         */
        public static final String FAILED = "failed";
    }

    /**
     * 资源类型常量
     */
    public static class ResourceType {
        /**
         * 人物角色
         */
        public static final String CHARACTER = "character";
        /**
         * 场景
         */
        public static final String SCENE = "scene";
        /**
         * 道具
         */
        public static final String PROP = "prop";
        /**
         * 技能
         */
        public static final String SKILL = "skill";
    }
}
