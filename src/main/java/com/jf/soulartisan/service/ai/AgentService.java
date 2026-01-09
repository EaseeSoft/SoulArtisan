package com.jf.soulartisan.service.ai;

import com.jf.soulartisan.admin.entity.PointsConfig;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.service.PointsDeductService;
import com.jf.soulartisan.service.SiteConfigProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Agent服务类
 * 提供带工具调用能力的ChatClient
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AgentService {

    private final SiteConfigProvider siteConfigProvider;
    private final List<ToolCallback> allAgentTools;
    private final PointsDeductService pointsDeductService;

    /**
     * ChatClient缓存
     */
    private final Map<Long, ChatClient> chatClientCache = new ConcurrentHashMap<>();

    /**
     * 获取带工具的ChatClient
     *
     * @param siteId 站点ID
     * @return ChatClient实例
     */
    public ChatClient getChatClient(Long siteId) {
        return chatClientCache.computeIfAbsent(siteId, this::createChatClient);
    }

    /**
     * 创建带工具的ChatClient
     */
    private ChatClient createChatClient(Long siteId) {
        log.info("为站点 {} 创建带工具的ChatClient", siteId);

        SiteConfigProvider.GeminiApiConfig config = siteConfigProvider.getGeminiApiConfig(siteId);

        OpenAiApi openAiApi = OpenAiApi.builder()
                .baseUrl(config.getApiUrl())
                .apiKey(config.getApiKey())
                .build();

        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(OpenAiChatOptions.builder()
                        .model("gemini-2.5-flash")
                        .temperature(0.7)
                        .build())
                .build();

        // 创��带工具的ChatClient
        ChatClient chatClient = ChatClient.builder(chatModel)
                .defaultToolCallbacks(allAgentTools.toArray(new ToolCallback[0]))
                .build();

        log.info("站点 {} 的ChatClient创建成功，注册了 {} 个工具", siteId, allAgentTools.size());

        return chatClient;
    }

    /**
     * 刷新站点的ChatClient缓存
     */
    public void refreshClient(Long siteId) {
        chatClientCache.remove(siteId);
        log.info("已刷新站点 {} 的ChatClient缓存", siteId);
    }

    /**
     * 刷新所有缓存
     */
    public void refreshAllClients() {
        chatClientCache.clear();
        log.info("已刷新所有ChatClient缓存");
    }

    /**
     * 执行Agent对话（带工具调用）
     *
     * @param siteId      站点ID
     * @param userMessage 用户消息
     * @return AI响应
     */
    public String chat(Long siteId, String userMessage) {
        log.info("[Agent] 开始对话: siteId={}, message={}", siteId, userMessage);

        // 检查并扣除积分
        Long userId = SecurityUtils.getAppLoginUserId();
        checkAndDeductPoints(userId);

        ChatClient client = getChatClient(siteId);

        String response = client.prompt()
                .user(userMessage)
                .call()
                .content();

        log.info("[Agent] 对话完成: response={}", response);

        return response;
    }

    /**
     * 执行Agent对话（带系统提示词）
     *
     * @param siteId       站点ID
     * @param systemPrompt 系统提示词
     * @param userMessage  用户消息
     * @return AI响应
     */
    public String chatWithSystem(Long siteId, String systemPrompt, String userMessage) {
        log.info("[Agent] 开始对话(带系统提示): siteId={}", siteId);

        // 检查并扣除积分
        Long userId = SecurityUtils.getAppLoginUserId();
        checkAndDeductPoints(userId);

        ChatClient client = getChatClient(siteId);

        String response = client.prompt()
                .system(systemPrompt)
                .user(userMessage)
                .call()
                .content();

        log.info("[Agent] 对话完成");

        return response;
    }

    /**
     * 检查并扣除积分
     */
    private void checkAndDeductPoints(Long userId) {
        if (userId == null) {
            return;
        }
        if (!pointsDeductService.checkBalance(userId, PointsConfig.ConfigKey.GEMINI_CHAT)) {
            Integer requiredPoints = pointsDeductService.getRequiredPoints(userId, PointsConfig.ConfigKey.GEMINI_CHAT);
            throw new RuntimeException("积分不足，需要" + requiredPoints + "积分");
        }
        try {
            pointsDeductService.deductForGeminiChat(userId, null);
        } catch (Exception e) {
            log.warn("扣除积分失败: {}", e.getMessage());
        }
    }
}
