package com.jf.soulartisan.admin.aspect;

import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.security.SecurityUtils;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * 系统管理员权限切面
 * 检查当前管理员是否为系统管理员
 */
@Slf4j
@Aspect
@Component
public class SystemAdminAspect {

    @Autowired
    private AdminUserMapper adminUserMapper;

    @Around("@annotation(com.jf.soulartisan.admin.annotation.RequireSystemAdmin) || " +
            "@within(com.jf.soulartisan.admin.annotation.RequireSystemAdmin)")
    public Object checkSystemAdmin(ProceedingJoinPoint joinPoint) throws Throwable {
        // 检查是否登录
        if (!SecurityUtils.isAdminLogin()) {
            throw new ServiceException("请先登录");
        }

        // 获取当前管理员信息
        Long adminId = SecurityUtils.getAdminLoginUserId();
        AdminUser adminUser = adminUserMapper.selectById(adminId);

        if (adminUser == null) {
            throw new ServiceException("管理员不存在");
        }

        // 检查是否为系统管理员
        if (!AdminUser.Role.SYSTEM_ADMIN.equals(adminUser.getRole())) {
            log.warn("非系统管理员尝试访问系统管理功能: adminId={}, role={}", adminId, adminUser.getRole());
            throw new ServiceException("权限不足，仅系统管理员可访问");
        }

        log.debug("系统管理员权限检查通过: adminId={}", adminId);

        // 执行目标方法
        return joinPoint.proceed();
    }
}
