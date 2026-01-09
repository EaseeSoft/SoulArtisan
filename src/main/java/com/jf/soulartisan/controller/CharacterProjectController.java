package com.jf.soulartisan.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.dto.characterproject.*;
import com.jf.soulartisan.entity.CharacterProject;
import com.jf.soulartisan.entity.CharacterProjectStoryboard;
import com.jf.soulartisan.entity.VideoResource;
import com.jf.soulartisan.service.CharacterProjectService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 角色项目控制器
 */
@Slf4j
@RestController
@RequestMapping("/character-project")
@Tag(name = "角色项目管理")
@SaUserCheckLogin
public class CharacterProjectController {

    @Resource
    private CharacterProjectService characterProjectService;

    // ==================== 项目管理 ====================

    /**
     * 创建项目
     */
    @PostMapping
    @Operation(summary = "创建角色项目")
    public Result<?> createProject(@Valid @RequestBody CreateCharacterProjectRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        try {
            CharacterProject project = characterProjectService.createProject(userId, siteId, request);

            Map<String, Object> data = new HashMap<>();
            data.put("id", project.getId());
            data.put("name", project.getName());
            data.put("description", project.getDescription());
            data.put("scriptId", project.getScriptId());
            data.put("style", project.getStyle());
            data.put("currentStep", project.getCurrentStep());
            data.put("status", project.getStatus());
            data.put("createdAt", project.getCreatedAt());

            return Result.success(data, "项目创建成功");

        } catch (Exception e) {
            log.error("创建角色项目失败: {}", e.getMessage(), e);
            return Result.error("创建项目失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取项目详情
     */
    @GetMapping("/{projectId}")
    @Operation(summary = "获取项目详情")
    public Result<?> getProject(@PathVariable Long projectId) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            CharacterProject project = characterProjectService.getProjectById(projectId, userId);

            Map<String, Object> data = new HashMap<>();
            data.put("id", project.getId());
            data.put("name", project.getName());
            data.put("description", project.getDescription());
            data.put("scriptId", project.getScriptId());
            data.put("style", project.getStyle());
            data.put("scriptContent", project.getScriptContent());
            data.put("currentStep", project.getCurrentStep());
            data.put("status", project.getStatus());
            data.put("createdAt", project.getCreatedAt());
            data.put("updatedAt", project.getUpdatedAt());

            return Result.success(data);

        } catch (Exception e) {
            log.error("获取项目详情失败: {}", e.getMessage(), e);
            return Result.error("获取项目失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取项目列表
     */
    @GetMapping("/list")
    @Operation(summary = "获取项目列表")
    public Result<?> listProjects(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer page,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "20") Integer pageSize
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Page<CharacterProject> pageResult = characterProjectService.listProjects(userId, page, pageSize);
            return Result.success(PageResult.of(pageResult));

        } catch (Exception e) {
            log.error("获取项目列表失败: {}", e.getMessage(), e);
            return Result.error("获取列表失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 更新项目
     */
    @PutMapping("/{projectId}")
    @Operation(summary = "更新项目")
    public Result<?> updateProject(
            @PathVariable Long projectId,
            @Valid @RequestBody UpdateCharacterProjectRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            CharacterProject project = characterProjectService.updateProject(projectId, userId, request);
            return Result.success(project, "更新成功");

        } catch (Exception e) {
            log.error("更新项目失败: {}", e.getMessage(), e);
            return Result.error("更新失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 删除项目
     */
    @DeleteMapping("/{projectId}")
    @Operation(summary = "删除项目")
    public Result<?> deleteProject(@PathVariable Long projectId) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            characterProjectService.deleteProject(projectId, userId);
            return Result.success(null, "删除成功");

        } catch (Exception e) {
            log.error("删除项目失败: {}", e.getMessage(), e);
            return Result.error("删除失败: " + e.getMessage(), 500);
        }
    }

    // ==================== 步骤1：输入剧本 ====================

    /**
     * 保存剧本内容
     */
    @PostMapping("/{projectId}/script")
    @Operation(summary = "保存剧本内容和风格")
    public Result<?> saveScript(
            @PathVariable Long projectId,
            @Valid @RequestBody SaveScriptRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            CharacterProject project = characterProjectService.saveScript(projectId, userId, request);
            return Result.success(project, "保存成功");

        } catch (Exception e) {
            log.error("保存剧本失败: {}", e.getMessage(), e);
            return Result.error("保存失败: " + e.getMessage(), 500);
        }
    }

    // ==================== 步骤2：资源管理 ====================

    /**
     * 批量保存资源（提取创建）
     */
    @PostMapping("/{projectId}/resources/batch")
    @Operation(summary = "批量创建资源")
    public Result<?> batchCreateResources(
            @PathVariable Long projectId,
            @Valid @RequestBody BatchCreateResourceRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        try {
            List<VideoResource> resources = characterProjectService
                    .batchCreateResources(projectId, userId, siteId, request);

            Map<String, Object> data = new HashMap<>();
            data.put("projectId", projectId);
            data.put("successCount", resources.size());
            data.put("resources", resources);

            return Result.success(data, String.format("成功创建 %d 个资源", resources.size()));

        } catch (Exception e) {
            log.error("批量创建资源失败: {}", e.getMessage(), e);
            return Result.error("创建失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 从剧本选择资源（绑定已有资源）
     */
    @PostMapping("/{projectId}/resources/bind")
    @Operation(summary = "绑定已有资源")
    public Result<?> bindResources(
            @PathVariable Long projectId,
            @Valid @RequestBody BindResourcesRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            characterProjectService.bindResources(projectId, userId, request);
            return Result.success(null, "绑定成功");

        } catch (Exception e) {
            log.error("绑定资源失败: {}", e.getMessage(), e);
            return Result.error("绑定失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 解绑资源
     */
    @DeleteMapping("/{projectId}/resources/{resourceId}/unbind")
    @Operation(summary = "解绑资源")
    public Result<?> unbindResource(
            @PathVariable Long projectId,
            @PathVariable Long resourceId
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            characterProjectService.unbindResource(projectId, userId, resourceId);
            return Result.success(null, "解绑成功");

        } catch (Exception e) {
            log.error("解绑资源失败: {}", e.getMessage(), e);
            return Result.error("解绑失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取资源列表
     */
    @GetMapping("/{projectId}/resources")
    @Operation(summary = "获取项目资源列表")
    public Result<?> getProjectResources(@PathVariable Long projectId) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            List<Map<String, Object>> resources = characterProjectService
                    .getProjectResources(projectId, userId);

            Map<String, Object> data = new HashMap<>();
            data.put("projectId", projectId);
            data.put("resources", resources);
            data.put("total", resources.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("获取资源列表失败: {}", e.getMessage(), e);
            return Result.error("获取失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取可选资源列表（从剧本）
     */
    @GetMapping("/{projectId}/available-resources")
    @Operation(summary = "获取可选资源列表")
    public Result<?> getAvailableResources(
            @PathVariable Long projectId,
            @Parameter(description = "剧本ID") @RequestParam Long scriptId
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Map<String, Object> data = characterProjectService
                    .getAvailableResources(projectId, userId, scriptId);
            return Result.success(data);

        } catch (Exception e) {
            log.error("获取可选资源失败: {}", e.getMessage(), e);
            return Result.error("获取失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 生成资源视频
     */
    @PostMapping("/{projectId}/resources/{resourceId}/generate")
    @Operation(summary = "生成资源视频")
    public Result<?> generateResourceVideo(
            @PathVariable Long projectId,
            @PathVariable Long resourceId,
            @Valid @RequestBody GenerateResourceRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            VideoResource resource = characterProjectService
                    .generateResourceVideo(projectId, userId, resourceId, request);
            return Result.success(resource, "生成任务创建成功");

        } catch (Exception e) {
            log.error("生成资源视频失败: {}", e.getMessage(), e);
            return Result.error("生成失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 删除资源
     */
    @DeleteMapping("/{projectId}/resources/{resourceId}")
    @Operation(summary = "删除资源")
    public Result<?> deleteResource(
            @PathVariable Long projectId,
            @PathVariable Long resourceId
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            characterProjectService.deleteResource(projectId, userId, resourceId);
            return Result.success(null, "删除成功");

        } catch (Exception e) {
            log.error("删除资源失败: {}", e.getMessage(), e);
            return Result.error("删除失败: " + e.getMessage(), 500);
        }
    }

    // ==================== 步骤3：分镜创作 ====================

    /**
     * 批量保存分镜
     */
    @PostMapping("/{projectId}/storyboards/batch")
    @Operation(summary = "批量创建分镜")
    public Result<?> batchCreateStoryboards(
            @PathVariable Long projectId,
            @Valid @RequestBody BatchCreateStoryboardRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        try {
            List<CharacterProjectStoryboard> storyboards = characterProjectService
                    .batchCreateStoryboards(projectId, userId, siteId, request);

            Map<String, Object> data = new HashMap<>();
            data.put("projectId", projectId);
            data.put("successCount", storyboards.size());
            data.put("storyboards", storyboards);

            return Result.success(data, String.format("成功创建 %d 个分镜", storyboards.size()));

        } catch (Exception e) {
            log.error("批量创建分镜失败: {}", e.getMessage(), e);
            return Result.error("创建失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取分镜列表
     */
    @GetMapping("/{projectId}/storyboards")
    @Operation(summary = "获取项目分镜列表")
    public Result<?> getProjectStoryboards(@PathVariable Long projectId) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            List<Map<String, Object>> storyboards = characterProjectService
                    .getProjectStoryboards(projectId, userId);

            Map<String, Object> data = new HashMap<>();
            data.put("projectId", projectId);
            data.put("storyboards", storyboards);
            data.put("total", storyboards.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("获取分镜列表失败: {}", e.getMessage(), e);
            return Result.error("获取失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 绑定分镜资源
     */
    @PostMapping("/{projectId}/storyboards/{storyboardId}/resources")
    @Operation(summary = "绑定分镜资源")
    public Result<?> bindStoryboardResources(
            @PathVariable Long projectId,
            @PathVariable Long storyboardId,
            @Valid @RequestBody BindStoryboardResourcesRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            characterProjectService.bindStoryboardResources(projectId, userId, storyboardId, request);
            return Result.success(null, "绑定成功");

        } catch (Exception e) {
            log.error("绑定分镜资源失败: {}", e.getMessage(), e);
            return Result.error("绑定失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 解绑分镜资源
     */
    @DeleteMapping("/{projectId}/storyboards/{storyboardId}/resources/{resourceId}")
    @Operation(summary = "解绑分镜资源")
    public Result<?> unbindStoryboardResource(
            @PathVariable Long projectId,
            @PathVariable Long storyboardId,
            @PathVariable Long resourceId
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            characterProjectService.unbindStoryboardResource(projectId, userId, storyboardId, resourceId);
            return Result.success(null, "解绑成功");

        } catch (Exception e) {
            log.error("解绑分镜资源失败: {}", e.getMessage(), e);
            return Result.error("解绑失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 生成分镜视频
     */
    @PostMapping("/{projectId}/storyboards/{storyboardId}/generate")
    @Operation(summary = "生成分镜视频")
    public Result<?> generateStoryboardVideo(
            @PathVariable Long projectId,
            @PathVariable Long storyboardId
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            CharacterProjectStoryboard storyboard = characterProjectService
                    .generateStoryboardVideo(projectId, userId, storyboardId);
            return Result.success(storyboard, "生成任务创建成功");

        } catch (Exception e) {
            log.error("生成分镜视频失败: {}", e.getMessage(), e);
            return Result.error("生成失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 批量生成分镜视频
     */
    @PostMapping("/{projectId}/storyboards/batch-generate")
    @Operation(summary = "批量生成分镜视频")
    public Result<?> batchGenerateStoryboardVideos(
            @PathVariable Long projectId,
            @Valid @RequestBody BatchGenerateStoryboardsRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            List<CharacterProjectStoryboard> storyboards = characterProjectService
                    .batchGenerateStoryboardVideos(projectId, userId, request);

            Map<String, Object> data = new HashMap<>();
            data.put("projectId", projectId);
            data.put("successCount", storyboards.size());

            return Result.success(data, String.format("成功创建 %d 个生成任务", storyboards.size()));

        } catch (Exception e) {
            log.error("批量生成分镜视频失败: {}", e.getMessage(), e);
            return Result.error("批量生成失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 更新分镜
     */
    @PutMapping("/{projectId}/storyboards/{storyboardId}")
    @Operation(summary = "更新分镜")
    public Result<?> updateStoryboard(
            @PathVariable Long projectId,
            @PathVariable Long storyboardId,
            @Valid @RequestBody UpdateStoryboardRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            CharacterProjectStoryboard storyboard = characterProjectService
                    .updateStoryboard(projectId, userId, storyboardId, request);

            Map<String, Object> data = new HashMap<>();
            data.put("id", storyboard.getId());
            data.put("sceneName", storyboard.getSceneName());
            data.put("sceneDescription", storyboard.getSceneDescription());
            data.put("videoPrompt", storyboard.getVideoPrompt());
            data.put("status", storyboard.getStatus());
            data.put("updatedAt", storyboard.getUpdatedAt());

            return Result.success(data, "更新成功");

        } catch (Exception e) {
            log.error("更新分镜失败: {}", e.getMessage(), e);
            return Result.error("更新失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 删除分镜
     */
    @DeleteMapping("/{projectId}/storyboards/{storyboardId}")
    @Operation(summary = "删除分镜")
    public Result<?> deleteStoryboard(
            @PathVariable Long projectId,
            @PathVariable Long storyboardId
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            characterProjectService.deleteStoryboard(projectId, userId, storyboardId);
            return Result.success(null, "删除成功");

        } catch (Exception e) {
            log.error("删除分镜失败: {}", e.getMessage(), e);
            return Result.error("删除失败: " + e.getMessage(), 500);
        }
    }
}
