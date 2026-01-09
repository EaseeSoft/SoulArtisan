package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 工作流项目实体
 */
@Data
@TableName(value = "workflow_projects", autoResultMap = true)
public class WorkflowProject {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long siteId;

    /**
     * 关联的剧本ID（可选）
     */
    private Long scriptId;

    private String name;

    private String description;

    private String thumbnail;

    /**
     * 工作流类型
     * character-resource: 角色资源工作流
     * storyboard: 分镜图工作流
     */
    private String workflowType;

    /**
     * 项目风格（可选）
     * 当项目设置风格后，节点创建时可自动应用该风格
     * 可选值: realistic, anime, cartoon, oil painting, watercolor, sketch, 3D render, cyberpunk, minimalist, vintage
     */
    private String style;

    /**
     * 工作流完整数据（JSON）
     * 包含 nodes、edges、nodeOutputs、viewport
     */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private WorkflowData workflowData;

    private Integer nodeCount;

    private LocalDateTime lastOpenedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 工作流数据内部类
     */
    @Data
    public static class WorkflowData {
        /**
         * ReactFlow nodes 数组
         */
        private Object nodes;

        /**
         * ReactFlow edges 数组
         */
        private Object edges;

        /**
         * 节点输出数据（Zustand store）
         */
        private Object nodeOutputs;

        /**
         * 视口位置和缩放
         */
        private Object viewport;
    }

    /**
     * 工作流类型常量
     */
    public static class WorkflowType {
        /**
         * 角色资源工作流（生成视频角色/场景）
         */
        public static final String CHARACTER_RESOURCE = "character-resource";

        /**
         * 分镜图工作流（生成角色设计稿/场景九宫格图片）
         */
        public static final String STORYBOARD = "storyboard";
    }
}
