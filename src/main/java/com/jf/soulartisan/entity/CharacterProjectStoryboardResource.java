package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 分镜资源关联实体
 * 分镜与资源的多对多关系
 */
@Data
@TableName(value = "character_project_storyboard_resources", autoResultMap = true)
public class CharacterProjectStoryboardResource {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 分镜ID
     */
    private Long storyboardId;

    /**
     * 资源ID（关联 video_resources.id）
     */
    private Long resourceId;

    /**
     * 资源在分镜中的角色：main_character-主角，supporting-配角，scene-场景，prop-道具
     */
    private String resourceRole;

    /**
     * 排序顺序
     */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 资源角色常量
     */
    public static class ResourceRole {
        /**
         * 主角
         */
        public static final String MAIN_CHARACTER = "main_character";
        /**
         * 配角
         */
        public static final String SUPPORTING = "supporting";
        /**
         * 场景
         */
        public static final String SCENE = "scene";
        /**
         * 道具
         */
        public static final String PROP = "prop";
    }
}
