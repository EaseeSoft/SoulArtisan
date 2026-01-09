package com.jf.soulartisan.listener;

import com.jf.soulartisan.event.GeminiConfigChangedEvent;
import com.jf.soulartisan.service.ai.GeminiChatClientFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Gemini 配置变更监听器
 * 监听配置变更事件，自动刷新 ChatClient 缓存
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiConfigChangedListener {

    private final GeminiChatClientFactory chatClientFactory;

    @EventListener
    public void onConfigChanged(GeminiConfigChangedEvent event) {
        log.info("收到 Gemini 配置变更事件: siteId={}", event.getSiteId());
        chatClientFactory.refreshClient(event.getSiteId());
    }
}
