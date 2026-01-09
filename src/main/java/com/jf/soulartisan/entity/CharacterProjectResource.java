package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 角色项目资源关联实体
 * 项目与资源的多对多关系
 */
@Data
@TableName(value = "character_project_resources", autoResultMap = true)
public class CharacterProjectResource {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 角色项目ID
     */
    private Long projectId;

    /**
     * 资源ID（关联 video_resources.id）
     */
    private Long resourceId;

    /**
     * 来源类型：extract-提取创建，script-剧本选择
     */
    private String sourceType;

    /**
     * 来源剧本ID（source_type=script 时有值）
     */
    private Long sourceScriptId;

    /**
     * 排序顺序
     */
    private Integer sortOrder;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 来源类型常量
     */
    public static class SourceType {
        /**
         * 提取创建
         */
        public static final String EXTRACT = "extract";
        /**
         * 从剧本选择
         */
        public static final String SCRIPT = "script";
    }
}
