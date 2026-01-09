package com.jf.soulartisan.controller;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.common.constants.ChatPrompts;
import com.jf.soulartisan.common.dto.ChatCompletionRequest;
import com.jf.soulartisan.common.dto.ChatMessage;
import com.jf.soulartisan.common.dto.SimpleChatRequest;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.service.GeminiChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * AI 聊天接口
 */
@Slf4j
@RestController
@RequestMapping("/chat")
@Tag(name = "AI聊天接口")
public class ChatController {

    @Resource
    private GeminiChatService geminiChatService;

    /**
     * 简化的聊天接口（推荐使用）
     * 只需传入 content，后端自动构建 messages
     */
    @PostMapping("/send")
    @Operation(summary = "发送聊天消息（简化版）", description = "只需传入消息内容，后端自动构建消息格式")
    @SaUserCheckLogin
    public Result<?> sendMessage(@Valid @RequestBody SimpleChatRequest simpleRequest) {
        try {
            Long userId = SecurityUtils.getAppLoginUserId();
            Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

            log.info("收到简化聊天请求: userId={}, model={}, scenario={}, content={}",
                    userId, simpleRequest.getModel(), simpleRequest.getScenario(),
                    simpleRequest.getContent().substring(0, Math.min(50, simpleRequest.getContent().length())));

            ChatCompletionRequest request = convertToFullRequest(simpleRequest);
            JSONObject response = geminiChatService.chatCompletion(siteId, userId, request);

            if (response == null) {
                return Result.error("聊天服务暂时不可用", 500);
            }

            if (response.containsKey("error")) {
                String errorMsg = geminiChatService.extractErrorMessage(response);
                log.error("Gemini API 返回错误: {}", errorMsg);
                return Result.error("聊天失败: " + errorMsg, 500);
            }

            return Result.success(response, "聊天成功");

        } catch (Exception e) {
            log.error("聊天请求处理异常", e);
            return Result.error("聊天请求处理失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 聊天完成接口（完整版）
     * 支持传入完整的 messages 数组，用于多轮对话
     */
    @PostMapping("/completions")
    @Operation(summary = "聊天完成（完整版）", description = "支持多轮对话，需传入完整的 messages 数组")
    @SaUserCheckLogin
    public Result<?> chatCompletions(@Valid @RequestBody ChatCompletionRequest request) {
        try {
            Long userId = SecurityUtils.getAppLoginUserId();
            Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

            log.info("收到聊天请求: userId={}, model={}, scenario={}, messagesCount={}",
                    userId, request.getModel(), request.getScenario(), request.getMessages().size());

            JSONObject response = geminiChatService.chatCompletion(siteId, userId, request);

            if (response == null) {
                return Result.error("聊天服务暂时不可用", 500);
            }

            if (response.containsKey("error")) {
                String errorMsg = geminiChatService.extractErrorMessage(response);
                log.error("Gemini API 返回错误: {}", errorMsg);
                return Result.error("聊天失败: " + errorMsg, 500);
            }

            return Result.success(response, "聊天成功");

        } catch (Exception e) {
            log.error("聊天请求处理异常", e);
            return Result.error("聊天请求处理失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 流式聊天接口（SSE）
     * 支持实时流式输出，实现打字机效果
     */
    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "流式聊天（SSE）", description = "流式输出聊天内容，实现打字机效果")
    @SaUserCheckLogin
    public Flux<ServerSentEvent<String>> streamChat(@Valid @RequestBody ChatCompletionRequest request) {
        try {
            Long userId = SecurityUtils.getAppLoginUserId();
            Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

            log.info("收到流式聊天请求: userId={}, model={}", userId, request.getModel());

            return geminiChatService.streamChatCompletion(siteId, userId, request)
                    .map(content -> ServerSentEvent.<String>builder()
                            .data(content)
                            .build())
                    .concatWith(Flux.just(
                            ServerSentEvent.<String>builder()
                                    .event("done")
                                    .data("[DONE]")
                                    .build()
                    ))
                    .onErrorResume(e -> {
                        log.error("流式聊天异常: {}", e.getMessage(), e);
                        return Flux.just(ServerSentEvent.<String>builder()
                                .event("error")
                                .data(e.getMessage())
                                .build());
                    });

        } catch (Exception e) {
            log.error("流式聊天请求处理异常", e);
            return Flux.just(ServerSentEvent.<String>builder()
                    .event("error")
                    .data(e.getMessage())
                    .build());
        }
    }

    /**
     * 将简化请求转换为完整请求
     */
    private ChatCompletionRequest convertToFullRequest(SimpleChatRequest simpleRequest) {
        ChatCompletionRequest request = new ChatCompletionRequest();
        request.setModel(simpleRequest.getModel());
        request.setScenario(simpleRequest.getScenario());
        request.setTemperature(simpleRequest.getTemperature());
        request.setTopP(simpleRequest.getTopP());
        request.setMaxTokens(simpleRequest.getMaxTokens());
        request.setPresencePenalty(simpleRequest.getPresencePenalty());
        request.setFrequencyPenalty(simpleRequest.getFrequencyPenalty());

        // 构建 messages 列表
        List<ChatMessage> messages = new ArrayList<>();
        ChatMessage userMessage = new ChatMessage();
        userMessage.setRole("user");
        userMessage.setContent(simpleRequest.getContent());
        messages.add(userMessage);
        if (simpleRequest.getScenario() != null) {
            // 添加系统提示词
            ChatMessage systemMessage = new ChatMessage();
            systemMessage.setRole("system");
            systemMessage.setContent(ChatPrompts.getSystemPrompt(simpleRequest.getScenario()));
            messages.add(systemMessage);
        }

        request.setMessages(messages);

        return request;
    }

    /**
     * 获取指定场景的系统提示词
     */
    @GetMapping("/scenarios/{scenarioCode}/prompt")
    @Operation(summary = "获取场景提示词", description = "返回指定场景的系统提示词")
    public Result<?> getScenarioPrompt(@PathVariable String scenarioCode) {
        try {
            String prompt = ChatPrompts.getSystemPrompt(scenarioCode);

            if (StrUtil.isBlank(prompt)) {
                return Result.error("场景不存在", 404);
            }

            Map<String, String> result = new HashMap<>();
            result.put("scenario", scenarioCode);
            result.put("prompt", prompt);

            return Result.success(result);

        } catch (Exception e) {
            log.error("获取场景提示词失败", e);
            return Result.error("获取场景提示词失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取可用的 Gemini 模型列表
     */
    @GetMapping("/models")
    @Operation(summary = "获取模型列表", description = "返回所有可用的 Gemini 聊天模型")
    public Result<?> getModels() {
        try {
            List<Map<String, String>> models = List.of(
                    createModelInfo("gemini-2.5-pro", "Gemini 2.5 Pro (推荐)", "最强性能，适合复杂任务"),
                    createModelInfo("gemini-2.5-flash", "Gemini 2.5 Flash (快速)", "快速响应，适合日常对话"),
                    createModelInfo("gemini-2.5-pro-preview-06-05", "Gemini 2.5 Pro Preview", "预览版本"),
                    createModelInfo("gemini-2.5-pro-preview-06-05-thinking", "Gemini 2.5 Pro Thinking", "思维链模式"),
                    createModelInfo("gemini-2.5-flash-preview-05-20", "Gemini 2.5 Flash Preview", "Flash 预览版"),
                    createModelInfo("gemini-2.0-flash", "Gemini 2.0 Flash", "2.0 版本快速模型"),
                    createModelInfo("gemini-2.0-flash-thinking-exp-1219", "Gemini 2.0 Flash Thinking", "2.0 思维链"),
                    createModelInfo("gemini-exp-1206", "Gemini Exp 1206", "实验版本")
            );

            return Result.success(models);

        } catch (Exception e) {
            log.error("获取模型列表失败", e);
            return Result.error("获取模型列表失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 创建模型信息对象
     */
    private Map<String, String> createModelInfo(String value, String label, String description) {
        Map<String, String> model = new HashMap<>();
        model.put("value", value);
        model.put("label", label);
        model.put("description", description);
        return model;
    }
}
