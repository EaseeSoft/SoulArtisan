package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("users")
public class User {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String username;

    private String password;

    private String nickname;

    private String email;

    private String phone;

    /**
     * 用户头像URL
     */
    private String avatar;

    private Integer points;

    private String role;

    private String appId;

    /**
     * 站点ID（用于多站点隔离）
     */
    private Long siteId;

    /**
     * 用户状态: 0-禁用, 1-启用
     */
    private Integer status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 用户状态常量
     */
    public static class Status {
        public static final Integer DISABLED = 0;
        public static final Integer ENABLED = 1;
    }

    public static class Role {
        public static final String USER = "user";
        public static final String MEMBER = "member";
        public static final String ADMIN = "admin";
    }
}
