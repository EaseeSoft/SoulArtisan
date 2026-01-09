package com.jf.soulartisan.service.ai.tools;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Agent上下文
 * 使用ThreadLocal存储当前请求的用户ID和站点ID
 * 在Controller层设置，在Tool中获取
 */
@Slf4j
@Component
public class AgentContext {

    private static final ThreadLocal<Long> USER_ID = new ThreadLocal<>();
    private static final ThreadLocal<Long> SITE_ID = new ThreadLocal<>();

    /**
     * 设置当前上下文
     */
    public void setContext(Long userId, Long siteId) {
        USER_ID.set(userId);
        SITE_ID.set(siteId);
        log.debug("[AgentContext] 设置上下文: userId={}, siteId={}", userId, siteId);
    }

    /**
     * 获取当前用户ID
     */
    public Long getUserId() {
        Long userId = USER_ID.get();
        if (userId == null) {
            throw new IllegalStateException("AgentContext未初始化，请先调用setContext设置用户信息");
        }
        return userId;
    }

    /**
     * 获取当前站点ID
     */
    public Long getSiteId() {
        Long siteId = SITE_ID.get();
        if (siteId == null) {
            throw new IllegalStateException("AgentContext未初始化，请先调用setContext设置站点信息");
        }
        return siteId;
    }

    /**
     * 清除上下文（请求结束时调用）
     */
    public void clear() {
        USER_ID.remove();
        SITE_ID.remove();
        log.debug("[AgentContext] 已清除上下文");
    }
}
