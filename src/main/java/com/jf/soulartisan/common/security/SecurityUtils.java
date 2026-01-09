package com.jf.soulartisan.common.security;

import cn.dev33.satoken.exception.NotLoginException;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.util.PasswordUtil;

public class SecurityUtils {

    public static void adminLogout(Long userId) {
        StpKit.ADMIN.logout(userId);
    }

    public static void userLogout(Long userId) {
        StpKit.USER.logout(userId);
    }
    
    public static String adminLogin(Long userId) {
        StpKit.ADMIN.login(userId);
        return StpKit.ADMIN.getTokenValue();
    }

    public static String userLogin(Long userId) {
        StpKit.USER.login(userId);
        return StpKit.USER.getTokenValue();
    }

    public static String getAdminLoginToken() {
        return StpKit.ADMIN.getTokenValue();
    }

    public static String getUserLoginToken() {
        return StpKit.USER.getTokenValue();
    }

    public static boolean isAdminLogin() {
        return StpKit.ADMIN.isLogin();
    }

    public static boolean isUserLogin() {
        return StpKit.USER.isLogin();
    }

    public static Long getAdminLoginUserId() {
        try {
            return StpKit.ADMIN.getLoginIdAsLong();
        } catch (Exception e) {
            throw new ServiceException("获取用户ID异常");
        }
    }

    public static Long getAppLoginUserId() {
        try {
            return StpKit.USER.getLoginIdAsLong();
        } catch (Exception e) {
            throw new NotLoginException("获取用户ID异常", "USER", "NotLoginException");
        }
    }

    /**
     * 获取当前登录用户的站点ID
     *
     * @return 站点ID，如果未设置返回null
     */
    public static Long getAppLoginUserSiteId() {
        try {
            Object siteId = StpKit.USER.getSession().get("siteId");
            if (siteId == null) {
                return null;
            }
            if (siteId instanceof Long) {
                return (Long) siteId;
            }
            return Long.parseLong(siteId.toString());
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 获取当前登录用户的站点ID（必须存在）
     *
     * @return 站点ID
     * @throws ServiceException 如果站点ID不存在
     */
    public static Long getRequiredAppLoginUserSiteId() {
        Long siteId = getAppLoginUserSiteId();
        if (siteId == null) {
            throw new ServiceException("当前用户未绑定站点");
        }
        return siteId;
    }

    /**
     * 获取当前登录管理员的站点ID
     *
     * @return 站点ID，如果未设置返回null（系统管理员无站点）
     */
    public static Long getAdminLoginUserSiteId() {
        try {
            Object siteId = StpKit.ADMIN.getSession().get("siteId");
            if (siteId == null) {
                return null;
            }
            if (siteId instanceof Long) {
                return (Long) siteId;
            }
            return Long.parseLong(siteId.toString());
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 获取当前登录管理员的站点ID（必须存在）
     *
     * @return 站点ID
     * @throws ServiceException 如果站点ID不存在（系统管理员会抛出异常）
     */
    public static Long getRequiredAdminLoginUserSiteId() {
        Long siteId = getAdminLoginUserSiteId();
        if (siteId == null) {
            throw new ServiceException("当前管理员未绑定站点");
        }
        return siteId;
    }

    public static String encryptPassword(String password) {
        return PasswordUtil.encode(password);
    }

    public static boolean matchesPassword(String rawPassword, String encodedPassword) {
        return PasswordUtil.matches(rawPassword, encodedPassword);
    }

    public static Long getCurrentUserId() {
        try {
            if (StpKit.ADMIN.isLogin()) {
                return SecurityUtils.getAdminLoginUserId();
            }
            if (StpKit.USER.isLogin()) {
                return SecurityUtils.getAppLoginUserId();
            }
            return 0L;
        } catch (Exception e) {
            return 0L;
        }
    }
}
