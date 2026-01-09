package com.jf.soulartisan.admin.interceptor;

import com.jf.soulartisan.admin.context.SiteContext;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.common.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 站点上下文拦截器
 * 自动为站点管理员设置站点上下文
 */
@Slf4j
@Component
public class SiteContextInterceptor implements HandlerInterceptor {

    @Autowired
    private AdminUserMapper adminUserMapper;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        log.info("=== SiteContextInterceptor 拦截请求: {} ===", request.getRequestURI());
        
        // 如果是管理员登录状态
        if (SecurityUtils.isAdminLogin()) {
            try {
                Long adminId = SecurityUtils.getAdminLoginUserId();
                log.info("管理员已登录: adminId={}", adminId);
                
                AdminUser adminUser = adminUserMapper.selectById(adminId);
                if (adminUser == null) {
                    log.warn("未找到管理员信息: adminId={}", adminId);
                    return true;
                }

                log.info("管理员信息: id={}, username={}, role={}, siteId={}",
                        adminUser.getId(), adminUser.getUsername(), adminUser.getRole(), adminUser.getSiteId());

                // 如果是站点管理员，设置站点上下文
                if (AdminUser.Role.SITE_ADMIN.equals(adminUser.getRole())) {
                    SiteContext.setSiteId(adminUser.getSiteId());
                    log.info("✅ 站点管理员 - 设置站点上下文: adminId={}, siteId={}", adminId, adminUser.getSiteId());
                }
                // 系统管理员不设置站点ID，可以查看所有站点数据
                else if (AdminUser.Role.SYSTEM_ADMIN.equals(adminUser.getRole())) {
                    log.info("✅ 系统管理员 - 不设置站点上下文，可查看所有数据: adminId={}", adminId);
                } else {
                    log.warn("⚠️ 未知角色: adminId={}, role={}", adminId, adminUser.getRole());
                }
            } catch (Exception e) {
                log.error("❌ 设置站点上下文失败", e);
            }
        } else {
            log.info("管理员未登录，跳过站点上下文设置");
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // 请求结束后清理ThreadLocal，避免内存泄漏
        SiteContext.clear();
    }
}
