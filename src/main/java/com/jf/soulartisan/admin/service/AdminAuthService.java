package com.jf.soulartisan.admin.service;

import com.jf.soulartisan.admin.dto.request.AdminLoginRequest;
import com.jf.soulartisan.admin.dto.request.UpdatePasswordRequest;
import com.jf.soulartisan.admin.dto.response.AdminInfoResponse;
import com.jf.soulartisan.admin.dto.response.AdminLoginResponse;
import com.jf.soulartisan.admin.entity.AdminLoginLog;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.entity.Site;
import com.jf.soulartisan.admin.mapper.AdminLoginLogMapper;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.admin.mapper.SiteMapper;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.util.BeanUtils;
import com.jf.soulartisan.common.util.PasswordUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 管理员认证服务
 */
@Slf4j
@Service
public class AdminAuthService {

    @Autowired
    private AdminUserMapper adminUserMapper;

    @Autowired
    private AdminLoginLogMapper loginLogMapper;

    @Autowired
    private SiteMapper siteMapper;

    @Autowired
    private HttpServletRequest request;

    /**
     * 管理员登录
     *
     * @param loginRequest 登录请求
     * @return 登录响应
     */
    @Transactional(rollbackFor = Exception.class)
    public AdminLoginResponse login(AdminLoginRequest loginRequest) {
        String username = loginRequest.getUsername();
        String password = loginRequest.getPassword();

        // 1. 查询管理员
        AdminUser adminUser = adminUserMapper.selectByUsername(username);
        if (adminUser == null) {
            recordLoginLog(null, username, AdminLoginLog.Status.FAILED, "用户不存在");
            throw new ServiceException("用户名或密码错误");
        }

        // 2. 验证密码
        if (!PasswordUtil.matches(password, adminUser.getPassword())) {
            recordLoginLog(adminUser.getId(), username, AdminLoginLog.Status.FAILED, "密码错误");
            throw new ServiceException("用户名或密码错误");
        }

        // 3. 检查账号状态
        if (AdminUser.Status.DISABLED == adminUser.getStatus()) {
            recordLoginLog(adminUser.getId(), username, AdminLoginLog.Status.FAILED, "账号已被禁用");
            throw new ServiceException("账号已被禁用");
        }

        // 4. 执行登录（使用现有的SecurityUtils）
        String token = SecurityUtils.adminLogin(adminUser.getId());

        // 将 siteId 和 role 存储到 session 中，便于后续获取
        if (adminUser.getSiteId() != null) {
            StpKit.ADMIN.getSession().set("siteId", adminUser.getSiteId());
        }
        StpKit.ADMIN.getSession().set("role", adminUser.getRole());

        // 5. 更新最后登录信息
        String clientIp = getClientIp(request);
        adminUserMapper.updateLastLoginInfo(adminUser.getId(), clientIp);

        // 6. 记录登录日志
        recordLoginLog(adminUser.getId(), username, AdminLoginLog.Status.SUCCESS, "登录成功");

        // 7. 构建响应
        AdminLoginResponse response = new AdminLoginResponse();
        response.setToken(token);
        response.setAdminId(adminUser.getId());
        response.setUsername(adminUser.getUsername());
        response.setRealName(adminUser.getRealName());
        response.setRole(adminUser.getRole());
        response.setSiteId(adminUser.getSiteId());

        // 如果是站点管理员，获取站点名称
        if (adminUser.getSiteId() != null) {
            Site site = siteMapper.selectById(adminUser.getSiteId());
            if (site != null) {
                response.setSiteName(site.getSiteName());
            }
        }

        log.info("管理员登录成功: username={}, role={}, siteId={}", username, adminUser.getRole(), adminUser.getSiteId());

        return response;
    }

    /**
     * 管理员登出
     */
    public void logout() {
        if (SecurityUtils.isAdminLogin()) {
            Long adminId = SecurityUtils.getAdminLoginUserId();
            SecurityUtils.adminLogout(adminId);
            log.info("管理员登出: adminId={}", adminId);
        }
    }

    /**
     * 获取当前管理员信息
     *
     * @return 管理员信息
     */
    public AdminInfoResponse getCurrentAdminInfo() {
        if (!SecurityUtils.isAdminLogin()) {
            throw new ServiceException("请先登录");
        }

        Long adminId = SecurityUtils.getAdminLoginUserId();
        AdminUser adminUser = adminUserMapper.selectById(adminId);

        if (adminUser == null) {
            throw new ServiceException("管理员不存在");
        }

        AdminInfoResponse response = BeanUtils.toBean(adminUser, AdminInfoResponse.class);

        // 如果是站点管理员，获取站点名称
        if (adminUser.getSiteId() != null) {
            Site site = siteMapper.selectById(adminUser.getSiteId());
            if (site != null) {
                response.setSiteName(site.getSiteName());
            }
        }

        return response;
    }

    /**
     * 修改密码
     *
     * @param updatePasswordRequest 修改密码请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void updatePassword(UpdatePasswordRequest updatePasswordRequest) {
        if (!SecurityUtils.isAdminLogin()) {
            throw new ServiceException("请先登录");
        }

        Long adminId = SecurityUtils.getAdminLoginUserId();
        AdminUser adminUser = adminUserMapper.selectById(adminId);

        if (adminUser == null) {
            throw new ServiceException("管理员不存在");
        }

        // 验证旧密码
        if (!PasswordUtil.matches(updatePasswordRequest.getOldPassword(), adminUser.getPassword())) {
            throw new ServiceException("旧密码错误");
        }

        // 更新密码
        adminUser.setPassword(PasswordUtil.encode(updatePasswordRequest.getNewPassword()));
        // updatedBy 由 MyMetaObjectHandler 自动填充
        adminUserMapper.updateById(adminUser);

        log.info("管理员修改密码成功: adminId={}", adminId);
    }

    /**
     * 记录登录日志
     *
     * @param adminId  管理员ID
     * @param username 用户名
     * @param status   状态
     * @param message  消息
     */
    private void recordLoginLog(Long adminId, String username, Integer status, String message) {
        try {
            AdminLoginLog loginLog = new AdminLoginLog();
            loginLog.setAdminId(adminId);
            loginLog.setUsername(username);
            loginLog.setIp(getClientIp(request));
            loginLog.setStatus(status);
            loginLog.setMessage(message);
            // 解析浏览器和操作系统（简化版）
            String userAgent = request.getHeader("User-Agent");
            if (userAgent != null) {
                loginLog.setBrowser(parseBrowser(userAgent));
                loginLog.setOs(parseOs(userAgent));
            }

            loginLogMapper.insert(loginLog);
        } catch (Exception e) {
            log.error("记录登录日志失败", e);
        }
    }

    /**
     * 获取客户端IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    /**
     * 解析浏览器类型（简化版）
     */
    private String parseBrowser(String userAgent) {
        if (userAgent.contains("Edge")) {
            return "Edge";
        } else if (userAgent.contains("Chrome")) {
            return "Chrome";
        } else if (userAgent.contains("Firefox")) {
            return "Firefox";
        } else if (userAgent.contains("Safari")) {
            return "Safari";
        } else if (userAgent.contains("MSIE") || userAgent.contains("Trident")) {
            return "IE";
        }
        return "Unknown";
    }

    /**
     * 解析操作系统（简化版）
     */
    private String parseOs(String userAgent) {
        if (userAgent.contains("Windows")) {
            return "Windows";
        } else if (userAgent.contains("Mac")) {
            return "Mac OS";
        } else if (userAgent.contains("Linux")) {
            return "Linux";
        } else if (userAgent.contains("Android")) {
            return "Android";
        } else if (userAgent.contains("iPhone") || userAgent.contains("iPad")) {
            return "iOS";
        }
        return "Unknown";
    }
}
