package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 图片资源实体
 * 用于存储剧本相关的图片资源，包括角色、场景、道具、技能等类型
 */
@Data
@TableName("picture_resources")
public class PictureResource {

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
     * 项目ID
     */
    private Long projectId;

    /**
     * 剧本ID
     */
    private Long scriptId;

    /**
     * 资源名称
     */
    private String name;

    /**
     * 资源类型：character-角色, scene-场景, prop-道具, skill-技能
     */
    private String type;

    /**
     * 图片地址
     */
    private String imageUrl;

    /**
     * 提示词
     */
    private String prompt;

    /**
     * 状态：pending-未生成, generating-生成中, generated-已生成
     */
    private String status;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 资源类型常量
     */
    public static class Type {
        /**
         * 角色
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

    /**
     * 资源状态常量
     */
    public static class Status {
        /**
         * 未生成
         */
        public static final String PENDING = "pending";
        /**
         * 生成中
         */
        public static final String GENERATING = "generating";
        /**
         * 已生成
         */
        public static final String GENERATED = "generated";
    }
}
