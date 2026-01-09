package com.jf.soulartisan.event;

import org.springframework.context.ApplicationEvent;

/**
 * Gemini API 配置变更事件
 * 当站点的 Gemini API 配置（api_url 或 api_key）发生变化时触发
 */
public class GeminiConfigChangedEvent extends ApplicationEvent {

    private final Long siteId;

    public GeminiConfigChangedEvent(Object source, Long siteId) {
        super(source);
        this.siteId = siteId;
    }

    public Long getSiteId() {
        return siteId;
    }
}
