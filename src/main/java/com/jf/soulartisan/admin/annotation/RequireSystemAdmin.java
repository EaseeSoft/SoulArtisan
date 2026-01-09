package com.jf.soulartisan.admin.annotation;

import java.lang.annotation.*;

/**
 * 要求系统管理员权限注解
 * 用于标注只有系统管理员才能访问的接口（如站点管理）
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RequireSystemAdmin {
}
