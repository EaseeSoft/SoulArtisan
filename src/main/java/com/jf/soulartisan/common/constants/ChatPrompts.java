package com.jf.soulartisan.common.constants;

import com.jf.soulartisan.admin.entity.ChatPrompt;
import com.jf.soulartisan.admin.service.ChatPromptService;
import com.jf.soulartisan.common.util.SpringContextHolder;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;

import java.util.Objects;

/**
 * AI 聊天提示词配置
 * 所有提示词从数据库读取，如果查询不到则抛出异常
 */
@Slf4j
public class ChatPrompts {

    /**
     * 获取指定场景的系统提示词
     * 从数据库读取，如果查询不到或未启用则抛出异常
     *
     * @param scenario 场景枚举
     * @return 系统提示词
     * @throws IllegalStateException 如果提示词未配置或未启用
     */
    public static String getSystemPrompt(ChatScenario scenario) {
        if (scenario == null) {
            throw new IllegalArgumentException("场景不能为空");
        }
        return getSystemPrompt(scenario.getCode());
    }

    /**
     * 获取指定场景的系统提示词（根据场景代码）
     * 从数据库读取，如果查询不到或未启用则抛出异常
     *
     * @param scenarioCode 场景代码
     * @return 系统提示词
     * @throws IllegalStateException 如果提示词未配置或未启用
     */
    public static String getSystemPrompt(String scenarioCode) {
        ChatPrompt prompt = getPromptConfig(scenarioCode);

        return prompt.getSystemPrompt();
    }

    /**
     * 获取指定场景的完整配置
     * 从数据库读取，如果查询不到或未启用则抛出异常
     *
     * @param scenarioCode 场景代码
     * @return 提示词配置
     * @throws IllegalStateException 如果提示词未配置或未启用
     */
    public static ChatPrompt getPromptConfig(String scenarioCode) {
        if (scenarioCode == null || scenarioCode.isEmpty()) {
            throw new IllegalArgumentException("场景代码不能为空");
        }

        ChatPromptService chatPromptService = SpringContextHolder.getBean(ChatPromptService.class);
        if (chatPromptService == null) {
            throw new IllegalStateException("ChatPromptService 未初始化，请检查 Spring 容器配置");
        }

        ChatPrompt prompt = chatPromptService.getPromptByCode(scenarioCode);
        if (prompt == null) {
            throw new IllegalStateException("提示词配置不存在: " + scenarioCode + "，请在数据库中添加该配置");
        }
        if (!Objects.equals(prompt.getIsEnabled(), ChatPrompt.EnableStatus.ENABLED)) {
            throw new IllegalStateException("提示词配置已禁用: " + scenarioCode + "，请在后台启用该配置");
        }

        return prompt;
    }

    /**
     * 聊天场景类型枚举
     */
    @Getter
    public enum ChatScenario {
        PLAYBOOK_ROLE_ANALYSIS("playbook_role_analysis", "剧本角色分析", "帮助分析角色、场景和角色关系"),
        // 剧本角色分析图片提示词
        PLAYBOOK_ROLE_ANALYSIS_IMAGE_PROMPT("playbook_role_analysis_image_prompt", "剧本角色分析图片提示词", "帮助分析角色、场景和角色关系"),
        // 剧本场景分析图片提示词
        PLAYBOOK_SCENE_ANALYSIS_IMAGE_PROMPT("playbook_scene_analysis_image_prompt", "剧本场景分析图片提示词", "帮助分析故事场景"),
        // 分镜图片提示词转SORA2提示词
        PLAYBOOK_CAMERA_IMAGE_PROMPT("playbook_camera_image_prompt", "分镜图片提示词转SORA2提示词", "帮助分析角色、场景和角色关系"),
        // 图片反推提示词
        PLAYBOOK_IMAGE_PROMPT_REVERSE("playbook_image_prompt_reverse", "图片反推提示词", "图片反推提示词"),
        // 视频反推提示词
        PLAYBOOK_VIDEO_PROMPT_REVERSE("playbook_video_prompt_reverse", "视频反推提示词", "视频反推提示词"),
        PLAYBOOK_SCENE_ANALYSIS("playbook_scene_analysis", "剧本场景分析", "帮助分析故事场景"),
        PLAYBOOK_CAMERA_ANALYSIS("playbook_camera_analysis", "剧本分镜分析", "分析剧本生成分镜描述"),
        PLAYBOOK_CAMERA_LIST("playbook_camera_list", "生成分镜列表", "生成分镜列表"),
        // 剧本资产获取提示词
        PLAYBOOK_ASSET_GET("playbook_asset_get", "剧本资产获取(图片)", "剧本资产获取(图片)"),
        // 剧本资产提取-视频提示词
        PLAYBOOK_ASSET_EXTRACT_VIDEO("playbook_asset_extract_video", "剧本资产提取-视频", "剧本资产提取-视频"),
        PLAYBOOK_CAMERA_PROMPT("playbook_camera_prompt", "生成分镜图片提示词", "生成分镜图片提示词"),
        // 视频提示词资源替换
        PLAYBOOK_VIDEO_PROMPT_REPLACE("playbook_video_prompt_replace", "视频提示词资源替换", "视频提示词资源替换");

        private final String code;
        private final String label;
        private final String description;

        ChatScenario(String code, String label, String description) {
            this.code = code;
            this.label = label;
            this.description = description;
        }

        /**
         * 根据 code 获取场景枚举
         */
        public static ChatScenario fromCode(String code) {
            for (ChatScenario scenario : values()) {
                if (scenario.getCode().equals(code)) {
                    return scenario;
                }
            }
            throw new IllegalArgumentException("未知的提示词场景编码: " + code);
        }
    }
}
