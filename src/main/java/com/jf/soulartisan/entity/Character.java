package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 角色实体
 */
@Data
@TableName(value = "characters", autoResultMap = true)
public class Character {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long siteId;

    /**
     * 所属剧本ID（优先使用）
     */
    private Long scriptId;

    /**
     * 所属工作流项目ID（向后兼容，优先使用 scriptId）
     */
    private Long workflowProjectId;

    private String characterName;

    private String characterId;

    private String generationTaskId;

    private String videoTaskId;

    private String videoUrl;

    private String timestamps;

    private BigDecimal startTime;

    private BigDecimal endTime;

    private String status;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private Object resultData;

    private String characterImageUrl;

    private String characterVideoUrl;

    private String errorMessage;

    private Boolean isRealPerson;

    /**
     * 角色类型：character-人物角色, scene-场景角色, prop-道具, skill-技能
     */
    private String characterType;

    /**
     * 资源描述/提示词
     */
    private String prompt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    /**
     * 状态常量
     */
    public static class Status {
        public static final String NOT_GENERATED = "not_generated";
        public static final String PENDING = "pending";
        public static final String PROCESSING = "processing";
        public static final String COMPLETED = "completed";
        public static final String FAILED = "failed";
    }
}
