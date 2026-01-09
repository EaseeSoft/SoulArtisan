package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 剧本成员关联实体
 * 用于管理剧本的团队成员关系
 */
@Data
@TableName("script_members")
public class ScriptMember {

    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 剧本ID
     */
    private Long scriptId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 角色: creator-创建者, member-成员
     */
    private String role;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 角色常量
     */
    public static class Role {
        public static final String CREATOR = "creator";
        public static final String MEMBER = "member";
    }
}
