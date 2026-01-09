package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 角色项目实体
 * 提供从剧本输入、资源提取、角色生成到分镜生成的完整工作流程
 */
@Data
@TableName(value = "character_projects", autoResultMap = true)
public class CharacterProject {

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
     * 项目名称
     */
    private String name;

    /**
     * 项目描述
     */
    private String description;

    /**
     * 关联剧本ID
     */
    private Long scriptId;

    /**
     * 风格
     */
    private String style;

    /**
     * 剧本内容
     */
    private String scriptContent;

    /**
     * 当前步骤：1-输入剧本，2-提取资源，3-分镜创作
     */
    private Integer currentStep;

    /**
     * 项目状态：draft/in_progress/completed
     */
    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 步骤常量
     */
    public static class Step {
        public static final int INPUT_SCRIPT = 1;
        public static final int EXTRACT_RESOURCES = 2;
        public static final int CREATE_STORYBOARDS = 3;
    }

    /**
     * 状态常量
     */
    public static class Status {
        public static final String DRAFT = "draft";
        public static final String IN_PROGRESS = "in_progress";
        public static final String COMPLETED = "completed";
    }
}
