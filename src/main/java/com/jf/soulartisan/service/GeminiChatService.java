package com.jf.soulartisan.service;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.admin.entity.ChatPrompt;
import com.jf.soulartisan.common.constants.ChatPrompts;
import com.jf.soulartisan.common.dto.ChatCompletionRequest;
import com.jf.soulartisan.common.dto.ChatMessage;
import com.jf.soulartisan.entity.ChatRecord;
import com.jf.soulartisan.mapper.ChatRecordMapper;
import com.jf.soulartisan.service.ai.GeminiChatClientFactory;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Gemini 聊天服务
 * 使用 Spring AI 调用兼容 OpenAI 格式的 API
 */
@Slf4j
@Service
public class GeminiChatService {

    private final GeminiChatClientFactory chatClientFactory;

    @Resource
    private ChatRecordMapper chatRecordMapper;

    public GeminiChatService(GeminiChatClientFactory chatClientFactory) {
        this.chatClientFactory = chatClientFactory;
    }

    /**
     * 聊天完成（同步方式）
     *
     * @param siteId  站点ID
     * @param userId  用户ID
     * @param request 聊天请求
     * @return API响应（JSONObject格式，保持兼容性）
     */
    public JSONObject chatCompletion(Long siteId, Long userId, ChatCompletionRequest request) {
        LocalDateTime requestTime = LocalDateTime.now();

        try {
            // 构建 Spring AI 消息列表
            List<Message> messages = buildSpringAiMessages(request);

            // 构建请求选项
            OpenAiChatOptions options = buildChatOptions(request);

            // 创建 Prompt 并调用 API（带积分扣除）
            Prompt prompt = new Prompt(messages, options);
            ChatResponse response = chatClientFactory.callWithPointsDeduct(siteId, userId, prompt);

            // 记录响应时间
            LocalDateTime responseTime = LocalDateTime.now();

            // 转换为 JSONObject 格式（保持兼容性）
            JSONObject result = convertToJsonObject(response);

            // 保存聊天记录
            saveChatRecord(userId, request, response, requestTime, responseTime, ChatRecord.Status.SUCCESS, null);

            log.info("Gemini API 调用成功: model={}, tokens={}",
                    request.getModel(),
                    response.getMetadata() != null ? response.getMetadata().getUsage().getTotalTokens() : 0);

            return result;

        } catch (Exception e) {
            log.error("Gemini API 调用失败: {}", e.getMessage(), e);

            // 记录错误
            LocalDateTime responseTime = LocalDateTime.now();
            saveChatRecordError(userId, request, requestTime, responseTime, e.getMessage());

            return createErrorResponse("API 请求异常: " + e.getMessage());
        }
    }

    /**
     * 流式聊天完成
     *
     * @param siteId  站点ID
     * @param userId  用户ID
     * @param request 聊天请求
     * @return 流式响应
     */
    public Flux<String> streamChatCompletion(Long siteId, Long userId, ChatCompletionRequest request) {
        OpenAiChatModel chatModel = chatClientFactory.getChatModel(siteId);

        // 构建消息列表
        List<Message> messages = buildSpringAiMessages(request);

        // 构建请求选项
        OpenAiChatOptions options = buildChatOptions(request);

        // 创建 Prompt
        Prompt prompt = new Prompt(messages, options);

        log.info("开始流式聊天: userId={}, model={}", userId, request.getModel());

        // 返回流式响应
        return chatModel.stream(prompt)
                .map(response -> {
                    if (response.getResult() != null &&
                            response.getResult().getOutput() != null) {
                        String text = response.getResult().getOutput().getText();
                        return text != null ? text : "";
                    }
                    return "";
                })
                .filter(text -> !text.isEmpty())
                .doOnComplete(() -> log.info("流式聊天完成: userId={}", userId))
                .doOnError(e -> log.error("流式聊天异常: userId={}, error={}", userId, e.getMessage()));
    }

    /**
     * 简化版聊天（单轮对话）
     *
     * @param siteId      站点ID
     * @param model       模型名称
     * @param userMessage 用户消息内容
     * @return 助手回复
     */
    public String simpleChat(Long siteId, String model, String userMessage) {
        OpenAiChatModel chatModel = chatClientFactory.getChatModel(siteId);

        List<Message> messages = List.of(new UserMessage(userMessage));
        OpenAiChatOptions options = OpenAiChatOptions.builder().model(model).build();
        Prompt prompt = new Prompt(messages, options);

        ChatResponse response = chatModel.call(prompt);
        return response.getResult().getOutput().getText();
    }

    /**
     * 带系统提示词的聊天
     *
     * @param siteId       站点ID
     * @param model        模型名称
     * @param systemPrompt 系统提示词
     * @param userMessage  用户消息内容
     * @return 助手回复
     */
    public String chatWithSystem(Long siteId, String model, String systemPrompt, String userMessage) {
        OpenAiChatModel chatModel = chatClientFactory.getChatModel(siteId);

        List<Message> messages = List.of(
                new SystemMessage(systemPrompt),
                new UserMessage(userMessage)
        );
        OpenAiChatOptions options = OpenAiChatOptions.builder().model(model).build();
        Prompt prompt = new Prompt(messages, options);

        ChatResponse response = chatModel.call(prompt);
        return response.getResult().getOutput().getText();
    }

    /**
     * 多模态聊天完成（支持图片/视频）
     *
     * @param siteId       站点ID
     * @param userId       用户ID
     * @param model        模型名称
     * @param systemPrompt 系统提示词
     * @param mediaUrl     媒体文件 URL
     * @param userText     用户附加文本
     * @return API响应
     */
    public JSONObject multimodalChatCompletion(Long siteId, Long userId, String model,
                                               String systemPrompt, String mediaUrl, String userText) {
        OpenAiChatModel chatModel = chatClientFactory.getChatModel(siteId);
        LocalDateTime requestTime = LocalDateTime.now();

        try {
            // 构建消息列表
            List<Message> messages = new ArrayList<>();

            if (StrUtil.isNotBlank(systemPrompt)) {
                messages.add(new SystemMessage(systemPrompt));
            }

            // 构建用户消息（包含文本和媒体URL）
            // 注意：多模态内容通过特殊格式传递
            String content = StrUtil.isNotBlank(userText) ? userText : "请分析这张图片";
            // 使用 UserMessage 构造器，Spring AI 会自动处理
            UserMessage userMsg = new UserMessage(content);
            messages.add(userMsg);

            // 构建请求选项
            OpenAiChatOptions options = OpenAiChatOptions.builder()
                    .model(model)
                    .build();

            // 调用 API
            Prompt prompt = new Prompt(messages, options);
            ChatResponse response = chatModel.call(prompt);

            LocalDateTime responseTime = LocalDateTime.now();

            // 转换为 JSONObject 格式
            JSONObject result = convertToJsonObject(response);

            // 保存记录
            saveMultimodalChatRecord(userId, model, systemPrompt, mediaUrl, userText,
                    response, requestTime, responseTime);

            return result;

        } catch (Exception e) {
            log.error("多模态聊天异常: {}", e.getMessage(), e);
            return createErrorResponse("API 请求异常: " + e.getMessage());
        }
    }

    /**
     * 构建 Spring AI 消息列表
     */
    private List<Message> buildSpringAiMessages(ChatCompletionRequest request) {
        List<Message> messages = new ArrayList<>();

        // 检查是否已有系统消息
        boolean hasSystemMessage = request.getMessages().stream()
                .anyMatch(msg -> "system".equals(msg.getRole()));

        // 如果指定了场景且没有系统消息，添加系统提示词
        if (StrUtil.isNotBlank(request.getScenario()) && !hasSystemMessage) {
            String systemPrompt = ChatPrompts.getSystemPrompt(request.getScenario());
            if (StrUtil.isNotBlank(systemPrompt)) {
                messages.add(new SystemMessage(systemPrompt));
            }
        }

        // 转换用户消息
        for (ChatMessage msg : request.getMessages()) {
            switch (msg.getRole().toLowerCase()) {
                case "system" -> messages.add(new SystemMessage(msg.getContent()));
                case "user" -> messages.add(new UserMessage(msg.getContent()));
                case "assistant" -> messages.add(new AssistantMessage(msg.getContent()));
                default -> log.warn("未知的消息角色: {}", msg.getRole());
            }
        }

        return messages;
    }

    /**
     * 构建聊天选项
     */
    private OpenAiChatOptions buildChatOptions(ChatCompletionRequest request) {
        OpenAiChatOptions.Builder builder = OpenAiChatOptions.builder()
                .model(request.getModel());

        // 设置温度
        if (request.getTemperature() != null) {
            builder.temperature(request.getTemperature());
        } else if (StrUtil.isNotBlank(request.getScenario())) {
            ChatPrompt promptConfig = ChatPrompts.getPromptConfig(request.getScenario());
            if (promptConfig != null && promptConfig.getDefaultTemperature() != null) {
                builder.temperature(promptConfig.getDefaultTemperature().doubleValue());
            }
        }

        // 设置 maxTokens
        if (request.getMaxTokens() != null) {
            builder.maxTokens(request.getMaxTokens());
        } else if (StrUtil.isNotBlank(request.getScenario())) {
            ChatPrompt promptConfig = ChatPrompts.getPromptConfig(request.getScenario());
            if (promptConfig != null && promptConfig.getDefaultMaxTokens() != null) {
                builder.maxTokens(promptConfig.getDefaultMaxTokens());
            }
        }

        // 设置 topP
        if (request.getTopP() != null) {
            builder.topP(request.getTopP());
        }

        // 设置 presencePenalty
        if (request.getPresencePenalty() != null) {
            builder.presencePenalty(request.getPresencePenalty());
        }

        // 设置 frequencyPenalty
        if (request.getFrequencyPenalty() != null) {
            builder.frequencyPenalty(request.getFrequencyPenalty());
        }

        return builder.build();
    }

    /**
     * 将 Spring AI 响应转换为 JSONObject（保持兼容性）
     */
    private JSONObject convertToJsonObject(ChatResponse response) {
        JSONObject result = new JSONObject();

        if (response.getMetadata() != null) {
            result.put("id", response.getMetadata().getId());
            result.put("model", response.getMetadata().getModel());
        }

        // 构建 choices 数组
        JSONArray choices = new JSONArray();
        if (response.getResults() != null) {
            int index = 0;
            for (var generation : response.getResults()) {
                JSONObject choice = new JSONObject();
                choice.put("index", index++);

                JSONObject message = new JSONObject();
                message.put("role", "assistant");
                message.put("content", generation.getOutput() != null ? generation.getOutput().getText() : "");
                choice.put("message", message);

                if (generation.getMetadata() != null && generation.getMetadata().getFinishReason() != null) {
                    choice.put("finish_reason", generation.getMetadata().getFinishReason().toString().toLowerCase());
                }
                choices.add(choice);
            }
        }
        result.put("choices", choices);

        // 构建 usage 对象
        if (response.getMetadata() != null && response.getMetadata().getUsage() != null) {
            var usage = response.getMetadata().getUsage();
            JSONObject usageObj = new JSONObject();
            usageObj.put("prompt_tokens", usage.getPromptTokens());
            usageObj.put("completion_tokens", usage.getCompletionTokens());
            usageObj.put("total_tokens", usage.getTotalTokens());
            result.put("usage", usageObj);
        }

        return result;
    }

    /**
     * 创建错误响应
     */
    private JSONObject createErrorResponse(String errorMessage) {
        JSONObject error = new JSONObject();
        error.put("error", errorMessage);
        error.put("success", false);
        return error;
    }

    /**
     * 从响应中提取助手回复内容
     */
    public String extractAssistantMessage(JSONObject response) {
        if (response == null || response.containsKey("error")) {
            return null;
        }

        try {
            if (!response.containsKey("choices")) {
                return null;
            }

            JSONArray choices = response.getJSONArray("choices");
            if (choices == null || choices.isEmpty()) {
                return null;
            }

            JSONObject firstChoice = choices.getJSONObject(0);
            if (firstChoice == null || !firstChoice.containsKey("message")) {
                return null;
            }

            JSONObject message = firstChoice.getJSONObject("message");
            return message != null ? message.getString("content") : null;

        } catch (Exception e) {
            log.error("提取助手消息失败: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 从响应中提取错误信息
     */
    public String extractErrorMessage(JSONObject response) {
        if (response == null) {
            return "未知错误";
        }

        if (response.containsKey("error")) {
            Object error = response.get("error");
            if (error instanceof String) {
                return (String) error;
            } else if (error instanceof JSONObject errorObj) {
                return errorObj.getString("message");
            }
        }

        return "未知错误";
    }

    /**
     * 保存聊天记录
     */
    private void saveChatRecord(Long userId, ChatCompletionRequest request,
                                ChatResponse response, LocalDateTime requestTime,
                                LocalDateTime responseTime, String status, String errorMessage) {
        try {
            ChatRecord record = new ChatRecord();
            record.setUserId(userId);
            record.setModel(request.getModel());
            record.setScenario(request.getScenario());
            record.setStatus(status);
            record.setErrorMessage(errorMessage);
            record.setRequestTime(requestTime);
            record.setResponseTime(responseTime);

            // 计算耗时
            long durationMs = ChronoUnit.MILLIS.between(requestTime, responseTime);
            record.setDurationMs((int) durationMs);

            // 保存消息列表
            List<Map<String, String>> messages = new ArrayList<>();
            for (ChatMessage msg : request.getMessages()) {
                Map<String, String> message = new HashMap<>();
                message.put("role", msg.getRole());
                message.put("content", msg.getContent());
                messages.add(message);
            }
            record.setMessages(messages);

            // 计算输入文本长度
            int inputLength = messages.stream()
                    .mapToInt(msg -> msg.getOrDefault("content", "").length())
                    .sum();
            record.setInputLength(inputLength);

            // 保存请求参数
            Map<String, Object> params = new HashMap<>();
            if (request.getTemperature() != null) {
                params.put("temperature", request.getTemperature());
            }
            if (request.getTopP() != null) {
                params.put("topP", request.getTopP());
            }
            if (request.getMaxTokens() != null) {
                params.put("maxTokens", request.getMaxTokens());
            }
            record.setRequestParams(params);

            // 从响应提取信息
            if (response != null && response.getMetadata() != null) {
                var usage = response.getMetadata().getUsage();
                if (usage != null) {
                    record.setPromptTokens((int) usage.getPromptTokens());
                    record.setCompletionTokens((int) usage.getCompletionTokens());
                    record.setTotalTokens((int) usage.getTotalTokens());
                }

                if (response.getResult() != null && response.getResult().getOutput() != null) {
                    String content = response.getResult().getOutput().getText();
                    record.setResponseContent(content);
                    record.setOutputLength(content != null ? content.length() : 0);
                }
            }

            chatRecordMapper.insert(record);
            log.debug("聊天记录已保存: recordId={}, userId={}, model={}", record.getId(), userId, request.getModel());

        } catch (Exception e) {
            log.error("保存聊天记录失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 保存错误聊天记录
     */
    private void saveChatRecordError(Long userId, ChatCompletionRequest request,
                                     LocalDateTime requestTime, LocalDateTime responseTime,
                                     String errorMessage) {
        try {
            ChatRecord record = new ChatRecord();
            record.setUserId(userId);
            record.setModel(request.getModel());
            record.setScenario(request.getScenario());
            record.setStatus(ChatRecord.Status.ERROR);
            record.setErrorMessage(errorMessage);
            record.setRequestTime(requestTime);
            record.setResponseTime(responseTime);
            record.setDurationMs((int) ChronoUnit.MILLIS.between(requestTime, responseTime));
            record.setPromptTokens(0);
            record.setCompletionTokens(0);
            record.setTotalTokens(0);
            record.setOutputLength(0);

            chatRecordMapper.insert(record);
        } catch (Exception e) {
            log.error("保存错误聊天记录失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 保存多模态聊天记录
     */
    private void saveMultimodalChatRecord(Long userId, String model, String systemPrompt,
                                          String mediaUrl, String userText,
                                          ChatResponse response,
                                          LocalDateTime requestTime, LocalDateTime responseTime) {
        try {
            ChatRecord record = new ChatRecord();
            record.setUserId(userId);
            record.setModel(model);
            record.setScenario("multimodal");
            record.setRequestTime(requestTime);
            record.setResponseTime(responseTime);
            record.setDurationMs((int) ChronoUnit.MILLIS.between(requestTime, responseTime));

            // 简化消息列表
            List<Map<String, String>> messages = new ArrayList<>();
            if (StrUtil.isNotBlank(systemPrompt)) {
                Map<String, String> sysMsg = new HashMap<>();
                sysMsg.put("role", "system");
                sysMsg.put("content", systemPrompt);
                messages.add(sysMsg);
            }
            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", "[多模态内容] mediaUrl=" + mediaUrl + ", text=" + userText);
            messages.add(userMsg);
            record.setMessages(messages);

            // 请求参数
            Map<String, Object> params = new HashMap<>();
            params.put("mediaUrl", mediaUrl);
            record.setRequestParams(params);

            // 输入长度
            int inputLength = (systemPrompt != null ? systemPrompt.length() : 0)
                    + (userText != null ? userText.length() : 0);
            record.setInputLength(inputLength);

            if (response != null && response.getMetadata() != null) {
                record.setStatus(ChatRecord.Status.SUCCESS);

                var usage = response.getMetadata().getUsage();
                if (usage != null) {
                    record.setPromptTokens((int) usage.getPromptTokens());
                    record.setCompletionTokens((int) usage.getCompletionTokens());
                    record.setTotalTokens((int) usage.getTotalTokens());
                }

                if (response.getResult() != null && response.getResult().getOutput() != null) {
                    String content = response.getResult().getOutput().getText();
                    record.setResponseContent(content);
                    record.setOutputLength(content != null ? content.length() : 0);
                }
            } else {
                record.setStatus(ChatRecord.Status.ERROR);
                record.setErrorMessage("响应为空");
            }

            chatRecordMapper.insert(record);
            log.info("多模态聊天记录已保存: recordId={}, userId={}, model={}", record.getId(), userId, model);

        } catch (Exception e) {
            log.error("保存多模态聊天记录失败: {}", e.getMessage(), e);
        }
    }
}
