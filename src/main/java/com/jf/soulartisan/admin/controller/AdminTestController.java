package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.context.SiteContext;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * 测试控制器 - 用于测试操作日志功能
 */
@Slf4j
@Tag(name = "测试接口", description = "用于测试系统功能的接口")
@RestController
@RequestMapping("/admin/test")
@SaAdminCheckLogin
public class AdminTestController {

    @Autowired
    private AdminUserMapper adminUserMapper;

    /**
     * 测试操作日志记录
     */
    @Operation(summary = "测试操作日志", description = "测试操作日志记录功能是否正常")
    @AdminLog(module = "系统测试", operation = "测试操作日志")
    @GetMapping("/log")
    public Result<String> testLog() {
        log.info("测试操作日志记录");
        return Result.success("操作日志测试成功！请查看 admin_operation_log 表是否有新记录");
    }

    /**
     * 获取当前管理员调试信息
     */
    @Operation(summary = "获取当前管理员调试信息", description = "用于排查站点数据隔离问题")
    @GetMapping("/debug-info")
    public Result<Map<String, Object>> getDebugInfo() {
        Map<String, Object> debugInfo = new HashMap<>();

        try {
            // 1. 获取当前登录管理员ID
            Long adminId = SecurityUtils.getAdminLoginUserId();
            debugInfo.put("adminId", adminId);
            log.info("🔍 当前管理员ID: {}", adminId);

            // 2. 查询管理员信息
            AdminUser adminUser = adminUserMapper.selectById(adminId);
            if (adminUser != null) {
                debugInfo.put("username", adminUser.getUsername());
                debugInfo.put("realName", adminUser.getRealName());
                debugInfo.put("role", adminUser.getRole());
                debugInfo.put("siteId", adminUser.getSiteId());
                debugInfo.put("status", adminUser.getStatus());
                log.info("👤 管理员信息: username={}, role={}, siteId={}",
                        adminUser.getUsername(), adminUser.getRole(), adminUser.getSiteId());
            } else {
                debugInfo.put("error", "未找到管理员信息");
                log.warn("⚠️ 未找到管理员信息: adminId={}", adminId);
            }

            // 3. 获取站点上下文
            Long contextSiteId = SiteContext.getSiteId();
            debugInfo.put("contextSiteId", contextSiteId);
            log.info("🏪 站点上下文: contextSiteId={}", contextSiteId);

            // 4. 判断角色
            if (adminUser != null) {
                boolean isSiteAdmin = AdminUser.Role.SITE_ADMIN.equals(adminUser.getRole());
                boolean isSystemAdmin = AdminUser.Role.SYSTEM_ADMIN.equals(adminUser.getRole());
                debugInfo.put("isSiteAdmin", isSiteAdmin);
                debugInfo.put("isSystemAdmin", isSystemAdmin);

                if (isSiteAdmin && contextSiteId == null) {
                    debugInfo.put("warning", "⚠️ 站点管理员但站点上下文未设置！这会导致数据隔离失效！");
                    log.error("❌ 站点管理员但站点上下文未设置: adminId={}, role={}, siteId={}",
                            adminId, adminUser.getRole(), adminUser.getSiteId());
                } else if (isSiteAdmin && !contextSiteId.equals(adminUser.getSiteId())) {
                    debugInfo.put("warning", "⚠️ 站点上下文与管理员站点ID不匹配！");
                    log.error("❌ 站点上下文不匹配: contextSiteId={}, adminSiteId={}",
                            contextSiteId, adminUser.getSiteId());
                }
            }

            return Result.success(debugInfo);
        } catch (Exception e) {
            log.error("❌ 获取调试信息失败", e);
            debugInfo.put("error", e.getMessage());
            return Result.error("获取调试信息失败: " + e.getMessage(), 500);
        }
    }
}
