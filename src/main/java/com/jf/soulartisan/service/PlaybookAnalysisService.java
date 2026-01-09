package com.jf.soulartisan.service;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.admin.entity.ChatPrompt;
import com.jf.soulartisan.common.constants.ChatPrompts;
import com.jf.soulartisan.common.enums.GeminiModel;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.util.JsonUtils;
import com.jf.soulartisan.entity.CharacterProjectResource;
import com.jf.soulartisan.entity.VideoResource;
import com.jf.soulartisan.mapper.CharacterProjectResourceMapper;
import com.jf.soulartisan.mapper.VideoResourceMapper;
import com.jf.soulartisan.service.ai.GeminiChatClientFactory;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * 剧本分析服务
 * 使用 Spring AI ChatClient 进行剧本解析
 */
@Slf4j
@Service
public class PlaybookAnalysisService {

    @Resource
    private GeminiChatClientFactory chatClientFactory;

    @Resource
    private CharacterProjectResourceMapper characterProjectResourceMapper;

    @Resource
    private VideoResourceMapper videoResourceMapper;

    /**
     * 通用场景分析 - 返回 JSON 对象
     *
     * @param siteId   站点ID
     * @param scenario 场景代码
     * @param content  用户输入内容
     * @return 解析后的 JSON 对象
     */
    public JSONObject analyzeToJson(Long siteId, ChatPrompts.ChatScenario scenario, String content) {
        String result = analyze(siteId, scenario, content);
        String jsonStr = JsonUtils.extractJsonString(result);
        if (jsonStr == null) {
            throw new ServiceException("AI 响应格式错误: 无效的 JSON");
        }
        return JSONObject.parseObject(jsonStr);
    }

    /**
     * 通用场景分析 - 返回原始字符串
     *
     * @param siteId   站点ID
     * @param scenario 场景代码
     * @param content  用户输入内容
     * @return AI 响应原始字符串
     */
    public String analyze(Long siteId, ChatPrompts.ChatScenario scenario, String content) {
        ChatPrompt promptConfig = ChatPrompts.getPromptConfig(scenario.getCode());
        return callChat(siteId, promptConfig, content);
    }

    /**
     * 分镜解析
     *
     * @param siteId             站点ID
     * @param characterProjectId 角色项目ID
     * @param style              风格
     * @param content            剧本内容
     * @param storyboardCount    分镜数量
     * @return 解析后的 JSON 对象
     */
    public JSONObject analyzeCamera(Long siteId, Long characterProjectId, String style,
                                    String content, Integer storyboardCount) {
        String finalContent = buildCameraAnalysisContent(characterProjectId, style, content, storyboardCount);
        return analyzeToJson(siteId, ChatPrompts.ChatScenario.PLAYBOOK_CAMERA_ANALYSIS, finalContent);
    }

    /**
     * 获取分镜列表
     */
    public JSONObject getCameraList(Long siteId, Long workflowProjectId, String content) {
        //String finalContent = buildCameraAnalysisContent(workflowProjectId, null, content, null);
        return analyzeToJson(siteId, ChatPrompts.ChatScenario.PLAYBOOK_CAMERA_LIST, content);
    }

    /**
     * 获取分镜图提示词
     */
    public String getCameraPrompt(Long siteId, String content) {
        return analyze(siteId, ChatPrompts.ChatScenario.PLAYBOOK_CAMERA_PROMPT, content);
    }

    /**
     * 分镜图片提示词转视频提示词
     *
     * @param siteId   站点ID
     * @param mediaUrl 媒体文件 URL（可选）
     * @param content  分镜剧本文案
     * @return 视频提示词
     */
    public String cameraImageToVideoPrompt(Long siteId, String mediaUrl, String content) {
        ChatPrompt promptConfig = ChatPrompts.getPromptConfig(
                ChatPrompts.ChatScenario.PLAYBOOK_CAMERA_IMAGE_PROMPT.getCode());

        if (StrUtil.isNotBlank(mediaUrl)) {
            // 多模态调用（包含图片）
            return callMultimodalChat(siteId, promptConfig.getSystemPrompt(), mediaUrl, content);
        } else {
            // 纯文本调用
            return callChat(siteId, promptConfig, content);
        }
    }

    /**
     * 提取视频资源
     *
     * @param siteId      站点ID
     * @param videoPrompt 视频提示词
     * @param resources   资源列表
     * @return 替换后的视频提示词
     */
    public String extractVideoResource(Long siteId, String videoPrompt,
                                       List<ResourceItem> resources) {
        StringBuilder resourceListStr = new StringBuilder();
        if (resources != null && !resources.isEmpty()) {
            resourceListStr.append("[资源列表]:\n");
            for (ResourceItem resource : resources) {
                resourceListStr.append("@").append(resource.characterId())
                        .append(": ").append(resource.name())
                        .append("\n");
            }
        }

        String finalContent = resourceListStr + "\n[视频提示词]:\n" + videoPrompt;
        return analyze(siteId, ChatPrompts.ChatScenario.PLAYBOOK_VIDEO_PROMPT_REPLACE, finalContent);
    }

    /**
     * 图片反推提示词
     */
    public String imagePromptReverse(Long siteId, String mediaUrl, String text, String model) {
        ChatPrompt promptConfig = ChatPrompts.getPromptConfig(
                ChatPrompts.ChatScenario.PLAYBOOK_IMAGE_PROMPT_REVERSE.getCode());

        String useModel = StrUtil.isNotBlank(model) ? model : GeminiModel.GEMINI_3_PRO_PREVIEW.getValue();
        return callMultimodalChat(siteId, useModel, promptConfig.getSystemPrompt(), mediaUrl, text);
    }

    /**
     * 视频反推提示词
     */
    public String videoPromptReverse(Long siteId, String mediaUrl, String text, String model) {
        ChatPrompt promptConfig = ChatPrompts.getPromptConfig(
                ChatPrompts.ChatScenario.PLAYBOOK_VIDEO_PROMPT_REVERSE.getCode());

        String useModel = StrUtil.isNotBlank(model) ? model : GeminiModel.GEMINI_3_PRO_PREVIEW.getValue();
        return callMultimodalChat(siteId, useModel, promptConfig.getSystemPrompt(), mediaUrl, text);
    }

    // ==================== 私有方法 ====================

    /**
     * 调用 Chat API
     */
    private String callChat(Long siteId, ChatPrompt promptConfig, String userContent) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(promptConfig.getSystemPrompt()));
        messages.add(new UserMessage(userContent));

        OpenAiChatOptions.Builder optionsBuilder = OpenAiChatOptions.builder()
                .model(GeminiModel.GEMINI_3_PRO_PREVIEW.getValue());

        if (promptConfig.getDefaultTemperature() != null) {
            optionsBuilder.temperature(promptConfig.getDefaultTemperature().doubleValue());
        }
        if (promptConfig.getDefaultMaxTokens() != null) {
            optionsBuilder.maxTokens(promptConfig.getDefaultMaxTokens());
        }

        Prompt prompt = new Prompt(messages, optionsBuilder.build());
        ChatResponse response = chatClientFactory.callWithPointsDeduct(siteId, prompt);

        return extractContent(response);
    }

    /**
     * 多模态调用（默认模型）
     */
    private String callMultimodalChat(Long siteId, String systemPrompt, String mediaUrl, String userText) {
        return callMultimodalChat(siteId, GeminiModel.GEMINI_3_PRO_PREVIEW.getValue(),
                systemPrompt, mediaUrl, userText);
    }

    /**
     * 多模态调用（指定模型）
     */
    private String callMultimodalChat(Long siteId, String model, String systemPrompt,
                                      String mediaUrl, String userText) {
        List<Message> messages = new ArrayList<>();
        if (StrUtil.isNotBlank(systemPrompt)) {
            messages.add(new SystemMessage(systemPrompt));
        }

        String content = StrUtil.isNotBlank(userText) ? userText : "请分析这个内容";
        messages.add(new UserMessage(content));

        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(model)
                .build();

        Prompt prompt = new Prompt(messages, options);
        ChatResponse response = chatClientFactory.callWithPointsDeduct(siteId, prompt);

        return extractContent(response);
    }

    /**
     * 从响应中提取内容
     */
    private String extractContent(ChatResponse response) {
        if (response == null || response.getResult() == null ||
                response.getResult().getOutput() == null) {
            throw new ServiceException("AI 响应为空");
        }
        String text = response.getResult().getOutput().getText();
        if (StrUtil.isBlank(text)) {
            throw new ServiceException("AI 响应内容为空");
        }
        return text;
    }

    /**
     * 构建分镜解析的内容
     */
    private String buildCameraAnalysisContent(Long characterProjectId, String style,
                                              String content, Integer storyboardCount) {
        StringBuilder finalContent = new StringBuilder();

        if (storyboardCount != null && storyboardCount > 0) {
            finalContent.append("【分镜数量】").append(storyboardCount).append("\n");
        }
        if (StrUtil.isNotEmpty(style)) {
            finalContent.append("【剧本风格】").append(style).append("\n");
        }

        // 如果有角色项目ID，查询关联的资源
        if (characterProjectId != null) {
            List<CharacterProjectResource> relations = characterProjectResourceMapper.selectByProjectId(characterProjectId);

            if (relations != null && !relations.isEmpty()) {
                StringBuilder resourceList = new StringBuilder();
                for (int i = 0; i < relations.size(); i++) {
                    CharacterProjectResource relation = relations.get(i);
                    VideoResource resource = videoResourceMapper.selectById(relation.getResourceId());
                    if (resource != null && resource.getCharacterId() != null) {
                        if (!resourceList.isEmpty()) {
                            resourceList.append("、");
                        }
                        resourceList.append(resource.getCharacterId())
                                .append("：").append(resource.getResourceName());
                    }
                }

                if (resourceList.length() > 0) {
                    finalContent.append("【资源列表(ID：Name)】").append(resourceList).append("\n");
                }
            }
        }

        // 添加剧本内容
        finalContent.append("【剧本】").append(content);

        return finalContent.toString();
    }

    /**
     * 资源项记录
     */
    public record ResourceItem(String characterId, String name) {
    }
}
