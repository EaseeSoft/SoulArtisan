package com.jf.soulartisan.controller;

import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.service.ai.AgentService;
import com.jf.soulartisan.service.ai.tools.AgentContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

/**
 * Agent控制器
 * 提供Agent对话接口，支持工具调用
 */
@Slf4j
@RestController
@RequestMapping("/agent")
@Tag(name = "Agent接口", description = "AI Agent对话接口，支持工具调用")
@RequiredArgsConstructor
public class AgentController {

    private final AgentService agentService;
    private final AgentContext agentContext;

    /**
     * Agent对话接口
     */
    @PostMapping("/chat")
    @Operation(summary = "Agent对话", description = "与AI Agent对话，支持自动调用图片生成、文件上传等工具")
    @SaUserCheckLogin
    public Result<Map<String, Object>> chat(@Valid @RequestBody ChatRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        log.info("[AgentChat] userId={}, siteId={}, message={}", userId, siteId, request.getMessage());

        // 设置上下文，供工具获取用户信息
        agentContext.setContext(userId, siteId);

        try {
            String response;

            if (request.getSystemPrompt() != null && !request.getSystemPrompt().isEmpty()) {
                response = agentService.chatWithSystem(siteId, request.getSystemPrompt(), request.getMessage());
            } else {
                response = agentService.chat(siteId, request.getMessage());
            }

            Map<String, Object> result = new HashMap<>();
            result.put("response", response);
            result.put("userId", userId);
            result.put("siteId", siteId);

            return Result.success(result);

        } catch (Exception e) {
            log.error("[AgentChat] 对话失败: {}", e.getMessage(), e);
            return Result.error("对话失败: " + e.getMessage(), 500);
        } finally {
            // 确保上下文被清除
            agentContext.clear();
        }
    }

    /**
     * Agent对话请求
     */
    @Data
    public static class ChatRequest {
        @NotBlank(message = "消息不能为空")
        private String message;

        private String systemPrompt;
    }
}
