package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 剧本实体
 * 剧本是项目的上层容器，用于管理角色和场景资源的复用
 */
@Data
@TableName(value = "scripts", autoResultMap = true)
public class Script {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 所属用户ID
     */
    private Long userId;

    /**
     * 所属站点ID
     */
    private Long siteId;

    /**
     * 剧本名称
     */
    private String name;

    /**
     * 剧本描述
     */
    private String description;

    /**
     * 封面图URL
     */
    private String coverImage;

    /**
     * 状态: active-活跃, archived-归档
     */
    private String status;

    /**
     * 风格(使用GenerationStyle枚举值)
     */
    private String style;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 状态常量
     */
    public static class Status {
        public static final String ACTIVE = "active";
        public static final String ARCHIVED = "archived";
    }
}
