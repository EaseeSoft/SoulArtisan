package com.jf.soulartisan.service.ai.tools;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.ArrayList;
import java.util.List;

/**
 * Agent工具配置类
 * 注册所有Spring AI工具并提供ToolCallbackProvider
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class AgentToolsConfig {

    private final ImageGenerationTools imageGenerationTools;
    private final FileUploadTools fileUploadTools;

    /**
     * 提供图片生成工具的ToolCallbackProvider
     */
    @Bean
    public ToolCallbackProvider imageGenerationToolCallbackProvider() {
        log.info("注册图片生成工具...");
        return MethodToolCallbackProvider.builder()
                .toolObjects(imageGenerationTools)
                .build();
    }

    /**
     * 提供文件上传工具的ToolCallbackProvider
     */
    @Bean
    public ToolCallbackProvider fileUploadToolCallbackProvider() {
        log.info("注册文件上传工具...");
        return MethodToolCallbackProvider.builder()
                .toolObjects(fileUploadTools)
                .build();
    }

    /**
     * 获取所有工具回调（用于手动注册到ChatClient）
     */
    @Bean
    public List<ToolCallback> allAgentTools(
            ToolCallbackProvider imageGenerationToolCallbackProvider,
            ToolCallbackProvider fileUploadToolCallbackProvider
    ) {
        log.info("汇总所有Agent工具...");

        List<ToolCallback> allTools = new ArrayList<>();

        // 添加图片生成工具
        for (ToolCallback callback : imageGenerationToolCallbackProvider.getToolCallbacks()) {
            allTools.add(callback);
            log.info("  - 注册工具: {}", callback.getToolDefinition().name());
        }

        // 添加文件上传工具
        for (ToolCallback callback : fileUploadToolCallbackProvider.getToolCallbacks()) {
            allTools.add(callback);
            log.info("  - 注册工具: {}", callback.getToolDefinition().name());
        }

        log.info("共注册 {} 个Agent工具", allTools.size());

        return allTools;
    }
}
