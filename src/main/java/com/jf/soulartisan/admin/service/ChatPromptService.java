package com.jf.soulartisan.admin.service;

import com.jf.soulartisan.admin.entity.ChatPrompt;
import com.jf.soulartisan.admin.mapper.ChatPromptMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * AI 聊天提示词配置服务
 * 所有提示词配置从数据库读取
 */
@Slf4j
@Service
public class ChatPromptService {

    /**
     * 提示词缓存（code -> ChatPrompt）
     */
    private final Map<String, ChatPrompt> promptCache = new ConcurrentHashMap<>();
    @Autowired
    private ChatPromptMapper chatPromptMapper;
    /**
     * 缓存是否已初始化
     */
    private volatile boolean cacheInitialized = false;

    /**
     * 获取所有提示词配置列表
     *
     * @return 提示词配置列表
     */
    public List<ChatPrompt> getPromptList() {
        return chatPromptMapper.selectAllOrderBySortOrder();
    }

    /**
     * 获取所有启用的提示词配置列表
     *
     * @return 启用的提示词配置列表
     */
    public List<ChatPrompt> getEnabledPromptList() {
        return chatPromptMapper.selectAllEnabled();
    }

    /**
     * 根据场景编码获取提示词配置
     *
     * @param code 场景编码
     * @return 提示词配置，查询不到返回 null
     */
    public ChatPrompt getPromptByCode(String code) {
        if (code == null || code.isEmpty()) {
            return null;
        }
        // 先从缓存获取
        if (cacheInitialized && promptCache.containsKey(code)) {
            return promptCache.get(code);
        }
        // 从数据库获取
        ChatPrompt prompt = chatPromptMapper.selectByCode(code);
        if (prompt != null) {
            promptCache.put(code, prompt);
        }
        return prompt;
    }

    /**
     * 根据 ID 获取提示词配置
     *
     * @param id ID
     * @return 提示词配置
     */
    public ChatPrompt getPromptById(Long id) {
        return chatPromptMapper.selectById(id);
    }

    /**
     * 创建提示词配置
     *
     * @param chatPrompt 提示词配置
     * @return 创建后的配置（含ID）
     */
    @Transactional(rollbackFor = Exception.class)
    public ChatPrompt createPrompt(ChatPrompt chatPrompt) {
        // 检查 code 是否已存在
        ChatPrompt existing = chatPromptMapper.selectByCode(chatPrompt.getCode());
        if (existing != null) {
            throw new IllegalArgumentException("场景编码已存在: " + chatPrompt.getCode());
        }
        chatPromptMapper.insert(chatPrompt);
        // 清除缓存
        clearCache();
        log.info("创建提示词配置成功: code={}", chatPrompt.getCode());
        return chatPrompt;
    }

    /**
     * 更新提示词配置
     *
     * @param chatPrompt 提示词配置
     */
    @Transactional(rollbackFor = Exception.class)
    public void updatePrompt(ChatPrompt chatPrompt) {
        chatPromptMapper.updateById(chatPrompt);
        // 清除缓存
        clearCache();
        log.info("更新提示词配置成功: code={}", chatPrompt.getCode());
    }

    /**
     * 切换启用状态
     *
     * @param id        ID
     * @param isEnabled 是否启用
     */
    @Transactional(rollbackFor = Exception.class)
    public void toggleEnabled(Long id, Integer isEnabled) {
        ChatPrompt chatPrompt = chatPromptMapper.selectById(id);
        if (chatPrompt != null) {
            chatPrompt.setIsEnabled(isEnabled);
            chatPromptMapper.updateById(chatPrompt);
            // 清除缓存
            clearCache();
            log.info("切换提示词启用状态: id={}, isEnabled={}", id, isEnabled);
        }
    }

    /**
     * 获取提示词映射表（code -> ChatPrompt）
     *
     * @return 提示词映射表
     */
    public Map<String, ChatPrompt> getPromptMap() {
        if (!cacheInitialized) {
            refreshCache();
        }
        return new HashMap<>(promptCache);
    }

    /**
     * 获取启用的提示词映射表（code -> systemPrompt）
     *
     * @return 系统提示词映射表
     */
    public Map<String, String> getSystemPromptMap() {
        List<ChatPrompt> enabledPrompts = getEnabledPromptList();
        Map<String, String> result = new HashMap<>();
        for (ChatPrompt prompt : enabledPrompts) {
            result.put(prompt.getCode(), prompt.getSystemPrompt());
        }
        return result;
    }

    /**
     * 刷新缓存
     */
    public void refreshCache() {
        List<ChatPrompt> prompts = chatPromptMapper.selectAllEnabled();
        promptCache.clear();
        for (ChatPrompt prompt : prompts) {
            promptCache.put(prompt.getCode(), prompt);
        }
        cacheInitialized = true;
        log.info("刷新提示词缓存完成，共 {} 条", prompts.size());
    }

    /**
     * 清除缓存
     */
    public void clearCache() {
        promptCache.clear();
        cacheInitialized = false;
        log.info("清除提示词缓存");
    }

    /**
     * 检查是否已初始化数据
     *
     * @return 是否已初始化
     */
    public boolean isInitialized() {
        return chatPromptMapper.selectCount(null) > 0;
    }
}
