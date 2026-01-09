package com.jf.soulartisan.common.config;

import com.baomidou.mybatisplus.core.handlers.MetaObjectHandler;
import com.jf.soulartisan.common.security.SecurityUtils;
import org.apache.ibatis.reflection.MetaObject;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * MyBatis-Plus 自动填充处理器
 * 统一处理 createdAt、updatedAt、createdBy、updatedBy 字段
 */
@Component
public class MyMetaObjectHandler implements MetaObjectHandler {

    @Override
    public void insertFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        Long currentUserId = getCurrentUserId();

        // 填充创建时间
        this.strictInsertFill(metaObject, "createdAt", LocalDateTime.class, now);
        // 填充更新时间
        this.strictInsertFill(metaObject, "updatedAt", LocalDateTime.class, now);
        // 填充创建人
        this.strictInsertFill(metaObject, "createdBy", Long.class, currentUserId);
        // 填充更新人
        this.strictInsertFill(metaObject, "updatedBy", Long.class, currentUserId);
    }

    @Override
    public void updateFill(MetaObject metaObject) {
        LocalDateTime now = LocalDateTime.now();
        Long currentUserId = getCurrentUserId();

        // 填充更新时间
        this.strictUpdateFill(metaObject, "updatedAt", LocalDateTime.class, now);
        // 填充更新人
        this.strictUpdateFill(metaObject, "updatedBy", Long.class, currentUserId);
    }

    /**
     * 获取当前用户ID，未登录返回0
     */
    private Long getCurrentUserId() {
        try {
            return SecurityUtils.getCurrentUserId();
        } catch (Exception e) {
            return 0L;
        }
    }
}
