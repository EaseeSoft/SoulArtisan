package com.jf.soulartisan.admin.context;

/**
 * 站点上下文（ThreadLocal）
 * 用于在请求处理过程中存储和获取当前站点ID
 */
public class SiteContext {

    private static final ThreadLocal<Long> CURRENT_SITE_ID = new ThreadLocal<>();

    /**
     * 获取当前站点ID
     *
     * @return 站点ID，如果未设置则返回null
     */
    public static Long getSiteId() {
        return CURRENT_SITE_ID.get();
    }

    /**
     * 设置当前站点ID
     *
     * @param siteId 站点ID
     */
    public static void setSiteId(Long siteId) {
        CURRENT_SITE_ID.set(siteId);
    }

    /**
     * 检查当前是否设置了站点ID
     *
     * @return 如果已设置站点ID则返回true，否则返回false
     */
    public static boolean hasSiteId() {
        return CURRENT_SITE_ID.get() != null;
    }

    /**
     * 清除当前站点ID
     * 注意：请求结束后必须调用此方法清理ThreadLocal，避免内存泄漏
     */
    public static void clear() {
        CURRENT_SITE_ID.remove();
    }
}
