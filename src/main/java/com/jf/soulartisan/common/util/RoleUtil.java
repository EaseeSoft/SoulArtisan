package com.jf.soulartisan.common.util;

import java.util.HashMap;
import java.util.Map;

public class RoleUtil {

    public static final String ROLE_USER = "user";
    public static final String ROLE_MEMBER = "member";
    public static final String ROLE_ADMIN = "admin";

    private static final Map<String, Integer> ROLE_LEVELS = new HashMap<>();
    private static final Map<String, String> ROLE_DESCRIPTIONS = new HashMap<>();

    static {
        ROLE_LEVELS.put(ROLE_USER, 1);
        ROLE_LEVELS.put(ROLE_MEMBER, 2);
        ROLE_LEVELS.put(ROLE_ADMIN, 3);

        ROLE_DESCRIPTIONS.put(ROLE_USER, "普通用户");
        ROLE_DESCRIPTIONS.put(ROLE_MEMBER, "会员");
        ROLE_DESCRIPTIONS.put(ROLE_ADMIN, "管理员");
    }

    public static boolean isValidRole(String role) {
        return ROLE_LEVELS.containsKey(role);
    }

    public static int getRoleLevel(String role) {
        return ROLE_LEVELS.getOrDefault(role, 0);
    }

    public static String getRoleDescription(String role) {
        return ROLE_DESCRIPTIONS.getOrDefault(role, "未知角色");
    }

    public static boolean hasRole(String userRole, String requiredRole) {
        return userRole.equals(requiredRole);
    }

    public static boolean hasPermission(String userRole, String requiredRole) {
        return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
    }

    public static Map<String, Object>[] getRoleOptions() {
        return ROLE_LEVELS.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> option = new HashMap<>();
                    option.put("value", entry.getKey());
                    option.put("label", getRoleDescription(entry.getKey()));
                    option.put("level", entry.getValue());
                    return option;
                })
                .toArray(Map[]::new);
    }
}
