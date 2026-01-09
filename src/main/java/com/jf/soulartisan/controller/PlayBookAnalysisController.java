package com.jf.soulartisan.controller;

import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.common.constants.ChatPrompts;
import com.jf.soulartisan.common.dto.ExtractVideoResourceRequest;
import com.jf.soulartisan.common.dto.MediaReverseRequest;
import com.jf.soulartisan.common.dto.PlayAnalysisRequest;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.service.PlaybookAnalysisService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 剧本解析控制器
 * 使用 Spring AI 进行剧本分析
 */
@Slf4j
@RestController
@RequestMapping("/playbook-analysis")
@Tag(name = "剧本解析接口")
@SaUserCheckLogin
public class PlayBookAnalysisController {

    @Resource
    private PlaybookAnalysisService playbookAnalysisService;

    /**
     * 解析角色 返回图片提示词
     */
    @PostMapping("/roleImagePrompt")
    @Operation(summary = "解析角色生成图片提示词", description = "只需传入消息内容，后端自动构建消息格式")
    public Result<?> roleImagePrompt(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        logRequest("解析角色图片提示词", req.getContent());

        JSONObject result = playbookAnalysisService.analyzeToJson(
                siteId,
                ChatPrompts.ChatScenario.PLAYBOOK_ROLE_ANALYSIS_IMAGE_PROMPT,
                req.getContent()
        );
        return Result.success(result, "解析成功");
    }

    /**
     * 解析场景 返回图片提示词
     */
    @PostMapping("/sceneImagePrompt")
    @Operation(summary = "解析场景生成图片提示词", description = "只需传入消息内容，后端自动构建消息格式")
    public Result<?> sceneImagePrompt(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        logRequest("解析场景图片提示词", req.getContent());

        JSONObject result = playbookAnalysisService.analyzeToJson(
                siteId,
                ChatPrompts.ChatScenario.PLAYBOOK_SCENE_ANALYSIS_IMAGE_PROMPT,
                req.getContent()
        );
        return Result.success(result, "解析成功");
    }

    /**
     * 解析角色
     */
    @PostMapping("/role")
    @Operation(summary = "解析角色", description = "只需传入消息内容，后端自动构建消息格式")
    public Result<?> analysisRole(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        logRequest("解析角色", req.getContent());

        JSONObject result = playbookAnalysisService.analyzeToJson(
                siteId,
                ChatPrompts.ChatScenario.PLAYBOOK_ROLE_ANALYSIS,
                req.getContent()
        );
        return Result.success(result, "解析成功");
    }

    /**
     * 解析场景
     */
    @PostMapping("/scene")
    @Operation(summary = "解析场景", description = "只需传入消息内容，后端自动构建消息格式")
    public Result<?> analysisScene(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        logRequest("解析场景", req.getContent());

        JSONObject result = playbookAnalysisService.analyzeToJson(
                siteId,
                ChatPrompts.ChatScenario.PLAYBOOK_SCENE_ANALYSIS,
                req.getContent()
        );
        return Result.success(result, "解析成功");
    }

    /**
     * 解析分镜
     * 返回格式: [{id, copywriting, prompt}, ...]
     */
    @PostMapping("/camera")
    @Operation(summary = "解析分镜", description = "返回分镜数组，每个分镜包含id、copywriting、prompt字段")
    public Result<?> analysisCamera(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        log.info("收到解析分镜请求: style={}, characterProjectId={}, storyboardCount={}, content={}",
                req.getStyle(), req.getCharacterProjectId(), req.getStoryboardCount(),
                truncate(req.getContent()));

        JSONArray result = playbookAnalysisService.analyzeCamera(
                siteId,
                req.getCharacterProjectId(),
                req.getStyle(),
                req.getContent(),
                req.getStoryboardCount()
        );
        return Result.success(result, "解析成功");
    }

    /**
     * 获取分镜图提示词
     */
    @PostMapping("/getCameraPrompt")
    @Operation(summary = "获取分镜图提示词", description = "只需传入消息内容，后端自动构建消息格式")
    public Result<?> getCameraPrompt(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        logRequest("获取分镜图提示词", req.getContent());

        String result = playbookAnalysisService.getCameraPrompt(siteId, req.getContent());
        return Result.success(result, "解析成功");
    }

    /**
     * 解析剧本资源（角色、场景、道具、技能）
     */
    @PostMapping("/asset")
    @Operation(summary = "解析剧本资源", description = "提取剧本中的角色、场景、道具、技能等资源信息")
    public Result<?> analysisAsset(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        logRequest("解析剧本资源", req.getContent());

        JSONObject result = playbookAnalysisService.analyzeToJson(
                siteId,
                ChatPrompts.ChatScenario.PLAYBOOK_ASSET_GET,
                req.getContent()
        );
        return Result.success(result, "解析成功");
    }

    /**
     * 解析剧本视频资源
     */
    @PostMapping("/assetVideo")
    @Operation(summary = "解析剧本视频资源", description = "自动识别剧本中的视频资源信息")
    public Result<?> analysisAssetVideo(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        logRequest("解析剧本视频资源", req.getContent());

        JSONObject result = playbookAnalysisService.analyzeToJson(
                siteId,
                ChatPrompts.ChatScenario.PLAYBOOK_ASSET_EXTRACT_VIDEO,
                req.getContent()
        );
        return Result.success(result, "解析成功");
    }

    /**
     * 提取视频资源
     */
    @PostMapping("/extractVideoResource")
    @Operation(summary = "提取视频资源", description = "将视频提示词中的资源引用替换为 @ID 格式")
    public Result<?> extractVideoResource(@Valid @RequestBody ExtractVideoResourceRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        log.info("收到提取视频资源请求: resourceCount={}, videoPrompt={}",
                req.getResources() != null ? req.getResources().size() : 0,
                truncate(req.getVideoPrompt()));

        // 转换资源列表
        List<PlaybookAnalysisService.ResourceItem> resources = null;
        if (req.getResources() != null) {
            resources = req.getResources().stream()
                    .map(r -> new PlaybookAnalysisService.ResourceItem(r.getCharacterId(), r.getName()))
                    .toList();
        }

        String result = playbookAnalysisService.extractVideoResource(
                siteId, req.getVideoPrompt(), resources);
        return Result.success(result, "提取成功");
    }

    /**
     * 获取分镜列表
     */
    @PostMapping("/getCameraList")
    @Operation(summary = "获取分镜列表", description = "只需传入消息内容，后端自动构建消息格式")
    public Result<?> getCameraList(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        JSONObject result = playbookAnalysisService.getCameraList(
                siteId, null, req.getContent());
        return Result.success(result, "解析成功");
    }

    /**
     * 分镜图片提示词转视频提示词
     */
    @PostMapping("/cameraImageToVideoPrompt")
    @Operation(summary = "分镜图片提示词转视频提示词", description = "将分镜图的图片生成提示词转换为适合视频生成的提示词，支持传入图片URL")
    public Result<?> cameraImageToVideoPrompt(@Valid @RequestBody PlayAnalysisRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        log.info("收到分镜图片提示词转视频提示词请求: mediaUrl={}, content={}",
                req.getMediaUrl(), truncate(req.getContent()));

        String result = playbookAnalysisService.cameraImageToVideoPrompt(
                siteId, req.getMediaUrl(), req.getContent());
        return Result.success(result, "转换成功");
    }

    /**
     * 图片反推提示词
     */
    @PostMapping("/imagePromptReverse")
    @Operation(summary = "图片反推提示词", description = "传入图片 URL，AI 分析图片内容并生成提示词")
    public Result<?> imagePromptReverse(@Valid @RequestBody MediaReverseRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        log.info("收到图片反推请求: mediaUrl={}", req.getMediaUrl());

        String result = playbookAnalysisService.imagePromptReverse(
                siteId, req.getMediaUrl(), req.getText(), req.getModel());
        return Result.success(result, "图片分析成功");
    }

    /**
     * 视频反推提示词
     */
    @PostMapping("/videoPromptReverse")
    @Operation(summary = "视频反推提示词", description = "传入视频 URL，AI 分析视频内容并生成提示词")
    public Result<?> videoPromptReverse(@Valid @RequestBody MediaReverseRequest req) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        log.info("收到视频反推请求: mediaUrl={}", req.getMediaUrl());

        String result = playbookAnalysisService.videoPromptReverse(
                siteId, req.getMediaUrl(), req.getText(), req.getModel());
        return Result.success(result, "视频分析成功");
    }

    // ==================== 私有方法 ====================

    private void logRequest(String action, String content) {
        Long userId = SecurityUtils.getAppLoginUserId();
        log.info("收到{}请求: userId={}, content={}", action, userId, truncate(content));
    }

    private String truncate(String content) {
        if (content == null) return "";
        return content.substring(0, Math.min(50, content.length()));
    }
}
