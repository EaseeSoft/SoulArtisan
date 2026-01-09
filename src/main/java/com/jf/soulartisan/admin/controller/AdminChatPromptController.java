package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.annotation.RequireSystemAdmin;
import com.jf.soulartisan.admin.entity.ChatPrompt;
import com.jf.soulartisan.admin.service.ChatPromptService;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AI 聊天提示词配置控制器
 * 仅系统管理员可以配置
 */
@Tag(name = "提示词配置", description = "AI聊天提示词配置接口（系统管理员）")
@RestController
@RequestMapping("/admin/chat-prompts")
@SaAdminCheckLogin
@RequireSystemAdmin
public class AdminChatPromptController {

    @Autowired
    private ChatPromptService chatPromptService;

    /**
     * 获取提示词配置列表
     */
    @Operation(summary = "获取提示词配置列表", description = "获取所有提示词配置")
    @GetMapping("/list")
    public Result<List<ChatPrompt>> getPromptList() {
        List<ChatPrompt> prompts = chatPromptService.getPromptList();
        return Result.success(prompts);
    }

    /**
     * 获取单个提示词配置
     */
    @Operation(summary = "获取单个提示词配置", description = "根据ID获取提示词配置")
    @GetMapping("/{id}")
    public Result<ChatPrompt> getPromptById(@PathVariable Long id) {
        ChatPrompt prompt = chatPromptService.getPromptById(id);
        if (prompt == null) {
            return Result.error("提示词配置不存在", 404);
        }
        return Result.success(prompt);
    }

    /**
     * 创建提示词配置
     */
    @Operation(summary = "创建提示词配置", description = "创建新的提示词配置")
    @AdminLog(module = "提示词配置", operation = "创建提示词配置")
    @PostMapping
    public Result<ChatPrompt> createPrompt(@Valid @RequestBody ChatPrompt chatPrompt) {
        try {
            ChatPrompt created = chatPromptService.createPrompt(chatPrompt);
            return Result.success(created, "创建成功");
        } catch (IllegalArgumentException e) {
            return Result.error(e.getMessage(), 400);
        }
    }

    /**
     * 更新提示词配置
     */
    @Operation(summary = "更新提示词配置", description = "更新指定的提示词配置")
    @AdminLog(module = "提示词配置", operation = "更新提示词配置")
    @PutMapping("/{id}")
    public Result<Void> updatePrompt(@PathVariable Long id, @Valid @RequestBody ChatPrompt chatPrompt) {
        ChatPrompt existing = chatPromptService.getPromptById(id);
        if (existing == null) {
            return Result.error("提示词配置不存在", 404);
        }
        // 保留不可修改的字段
        chatPrompt.setId(id);
        chatPrompt.setCode(existing.getCode());  // code 不允许修改
        chatPromptService.updatePrompt(chatPrompt);
        return Result.success(null, "配置更新成功");
    }

    /**
     * 切换启用状态
     */
    @Operation(summary = "切换启用状态", description = "启用或禁用提示词配置")
    @AdminLog(module = "提示词配置", operation = "切换启用状态")
    @PutMapping("/{id}/toggle")
    public Result<Void> toggleEnabled(@PathVariable Long id, @RequestParam Integer isEnabled) {
        ChatPrompt existing = chatPromptService.getPromptById(id);
        if (existing == null) {
            return Result.error("提示词配置不存在", 404);
        }
        chatPromptService.toggleEnabled(id, isEnabled);
        return Result.success(null, isEnabled == 1 ? "已启用" : "已禁用");
    }

    /**
     * 刷新缓存
     */
    @Operation(summary = "刷新缓存", description = "刷新提示词配置缓存")
    @AdminLog(module = "提示词配置", operation = "刷新缓存")
    @PostMapping("/refresh-cache")
    public Result<Void> refreshCache() {
        chatPromptService.refreshCache();
        return Result.success(null, "缓存刷新成功");
    }
}
