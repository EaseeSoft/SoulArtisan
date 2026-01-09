package com.jf.soulartisan.admin.annotation;

import java.lang.annotation.*;

/**
 * 管理员操作日志注解
 * 用于标注需要记录操作日志的接口
 */
@Target({ElementType.METHOD})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface AdminLog {

    /**
     * 操作模块
     */
    String module() default "";

    /**
     * 操作类型
     */
    String operation() default "";
}
