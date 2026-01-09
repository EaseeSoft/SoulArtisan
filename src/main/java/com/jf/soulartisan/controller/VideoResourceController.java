package com.jf.soulartisan.controller;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.common.dto.*;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.common.util.VideoUtil;
import com.jf.soulartisan.entity.Script;
import com.jf.soulartisan.entity.VideoGenerationTask;
import com.jf.soulartisan.entity.VideoResource;
import com.jf.soulartisan.entity.WorkflowProject;
import com.jf.soulartisan.mapper.*;
import com.jf.soulartisan.service.CharacterService;
import com.jf.soulartisan.service.CosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

/**
 * 视频资源接口
 * 支持从剧本创建资源→生成视频→提取角色的完整流程
 */
@Slf4j
@RestController
@RequestMapping("/video-resource")
@Tag(name = "视频资源接口")
@SaUserCheckLogin
public class VideoResourceController {

    @Resource
    private VideoResourceMapper videoResourceMapper;

    @Resource
    private ScriptMapper scriptMapper;

    @Resource
    private ScriptMemberMapper scriptMemberMapper;

    @Resource
    private WorkflowProjectMapper workflowProjectMapper;

    @Resource
    private VideoGenerationTaskMapper videoGenerationTaskMapper;

    @Resource
    private CharacterService characterService;

    @Resource
    private CosService cosService;

    /**
     * 创建视频资源
     */
    @PostMapping("/create")
    @Operation(summary = "创建视频资源")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> createResource(@Valid @RequestBody VideoResourceCreateRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        try {
            // 验证项目是否存在且属于当前用户
            WorkflowProject project = workflowProjectMapper.selectById(request.getProjectId());
            if (project == null) {
                return Result.error("项目不存在", 404);
            }
            if (!project.getUserId().equals(userId)) {
                return Result.error("无权操作此项目", 403);
            }

            // 获取剧本ID
            Long scriptId = request.getScriptId();
            if (scriptId == null && project.getScriptId() != null) {
                scriptId = project.getScriptId();
            }

            // 生成唯一资源名称
            String resourceName = generateUniqueResourceName(
                    request.getResourceName().trim(),
                    request.getProjectId(),
                    scriptId,
                    null
            );

            // 创建资源
            VideoResource resource = new VideoResource();
            resource.setUserId(userId);
            resource.setSiteId(siteId);
            resource.setWorkflowProjectId(request.getProjectId());
            resource.setScriptId(scriptId);
            resource.setResourceName(resourceName);
            resource.setResourceType(StrUtil.isNotBlank(request.getResourceType())
                    ? request.getResourceType() : VideoResource.ResourceType.CHARACTER);
            resource.setPrompt(request.getPrompt());
            resource.setCharacterImageUrl(request.getImageUrl());
            resource.setIsRealPerson(false);

            // 根据图片是否存在设置状态
            if (StrUtil.isBlank(request.getImageUrl())) {
                resource.setStatus(VideoResource.Status.NOT_GENERATED);
            } else {
                resource.setStatus(VideoResource.Status.COMPLETED);
            }

            int result = videoResourceMapper.insert(resource);
            if (result <= 0) {
                log.error("保存资源失败: user_id={}", userId);
                return Result.error("保存资源失败", 500);
            }

            log.info("视频资源创建成功: id={}, name={}, projectId={}",
                    resource.getId(), resourceName, request.getProjectId());

            return Result.success(buildResourceResponse(resource), "资源创建成功");

        } catch (Exception e) {
            log.error("创建视频资源失败: {}", e.getMessage(), e);
            return Result.error("创建资源失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 批量创建视频资源
     */
    @PostMapping("/batch-create")
    @Operation(summary = "批量创建视频资源")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> batchCreateResources(@Valid @RequestBody VideoResourceBatchCreateRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        try {
            // 验证项目是否存在且属于当前用户
            WorkflowProject project = workflowProjectMapper.selectById(request.getProjectId());
            if (project == null) {
                return Result.error("项目不存在", 404);
            }
            if (!project.getUserId().equals(userId)) {
                return Result.error("无权操作此项目", 403);
            }

            // 获取剧本ID
            Long scriptId = request.getScriptId();
            if (scriptId == null && project.getScriptId() != null) {
                scriptId = project.getScriptId();
            }

            List<Map<String, Object>> createdResources = new ArrayList<>();
            int successCount = 0;
            int failCount = 0;

            for (VideoResourceBatchCreateRequest.ResourceItem item : request.getResources()) {
                try {
                    // 生成唯一名称
                    String uniqueName = generateUniqueResourceName(
                            item.getName().trim(),
                            request.getProjectId(),
                            scriptId,
                            null
                    );

                    // 创建资源实体
                    VideoResource resource = new VideoResource();
                    resource.setUserId(userId);
                    resource.setSiteId(siteId);
                    resource.setWorkflowProjectId(request.getProjectId());
                    resource.setScriptId(scriptId);
                    resource.setResourceName(uniqueName);
                    resource.setResourceType(StrUtil.isNotBlank(item.getType())
                            ? item.getType() : VideoResource.ResourceType.CHARACTER);
                    resource.setPrompt(item.getPrompt());
                    resource.setCharacterImageUrl(item.getImageUrl());
                    resource.setIsRealPerson(false);

                    // 根据图片是否存在设置状态
                    if (StrUtil.isBlank(item.getImageUrl())) {
                        resource.setStatus(VideoResource.Status.NOT_GENERATED);
                    } else {
                        resource.setStatus(VideoResource.Status.COMPLETED);
                    }

                    int result = videoResourceMapper.insert(resource);
                    if (result > 0) {
                        successCount++;
                        createdResources.add(buildResourceResponse(resource));
                    } else {
                        failCount++;
                        log.error("保存资源失败: name={}", item.getName());
                    }
                } catch (Exception e) {
                    failCount++;
                    log.error("创建资源失败: name={}, error={}", item.getName(), e.getMessage());
                }
            }

            log.info("批量创建资源完成: projectId={}, success={}, fail={}",
                    request.getProjectId(), successCount, failCount);

            Map<String, Object> data = new HashMap<>();
            data.put("projectId", request.getProjectId());
            data.put("successCount", successCount);
            data.put("failCount", failCount);
            data.put("resources", createdResources);

            if (failCount > 0 && successCount > 0) {
                return Result.success(data, String.format("部分创建成功：成功 %d 个，失败 %d 个", successCount, failCount));
            } else if (failCount > 0) {
                return Result.error("批量创建失败", 500);
            } else {
                return Result.success(data, String.format("成功创建 %d 个资源", successCount));
            }

        } catch (Exception e) {
            log.error("批量创建资源失败: {}", e.getMessage(), e);
            return Result.error("批量创建失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 从视频生成角色
     */
    @PostMapping("/generate-character")
    @Operation(summary = "从视频生成角色")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> generateCharacter(@Valid @RequestBody VideoResourceGenerateCharacterRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        try {
            // 验证请求参数
            request.validate();

            // 查询资源
            VideoResource resource = videoResourceMapper.selectById(request.getResourceId());
            if (resource == null) {
                return Result.error("资源不存在", 404);
            }
            if (!resource.getUserId().equals(userId)) {
                return Result.error("无权操作此资源", 403);
            }

            // 确定视频URL
            String videoUrl = request.getVideoUrl();
            String fromTask = request.getVideoTaskId();

            if (StrUtil.isNotBlank(fromTask)) {
                VideoGenerationTask videoTask = videoGenerationTaskMapper.selectByTaskId(fromTask);
                if (videoTask != null) {
                    videoUrl = videoTask.getResultUrl();
                }
            }

            // 调用角色生成API
            JSONObject response = characterService.createCharacterTask(
                    siteId,
                    request.getVideoUrl(),
                    request.getVideoTaskId(),
                    request.getTimestamps()
            );

            if (response == null) {
                return Result.error("调用角色生成服务失败", 500);
            }

            String generationTaskId = characterService.extractCharacterId(response);
            if (StrUtil.isBlank(generationTaskId)) {
                log.error("获取角色生成任务ID失败，响应: {}", response.toJSONString());
                return Result.error("获取角色生成任务ID失败", 500);
            }

            // 解析时间戳
            String[] parts = request.getTimestamps().split(",");
            BigDecimal startTime = new BigDecimal(parts[0].trim());
            BigDecimal endTime = new BigDecimal(parts[1].trim());

            // 更新资源
            resource.setVideoTaskId(fromTask);
            resource.setVideoUrl(videoUrl);
            resource.setTimestamps(request.getTimestamps());
            resource.setStartTime(startTime);
            resource.setEndTime(endTime);
            resource.setGenerationTaskId(generationTaskId);
            resource.setStatus(VideoResource.Status.CHARACTER_GENERATING);
            resource.setIsRealPerson(StrUtil.isNotBlank(fromTask));
            resource.setCharacterRequestedAt(java.time.LocalDateTime.now());

            // 提取视频第一帧作为预览图
            if (StrUtil.isNotBlank(videoUrl) && StrUtil.isBlank(resource.getCharacterImageUrl())) {
                try {
                    byte[] firstFrameBytes = VideoUtil.extractFirstFrame(videoUrl);
                    String imageUrl = cosService.uploadFile(siteId, firstFrameBytes, "video_resource_" + System.currentTimeMillis() + ".jpg");
                    resource.setCharacterImageUrl(imageUrl);
                    log.info("视频第一帧提取成功: {}", imageUrl);
                } catch (Exception e) {
                    log.error("提取视频第一帧失败: {}", e.getMessage(), e);
                }
            }

            int result = videoResourceMapper.updateById(resource);
            if (result <= 0) {
                log.error("更新资源失败: id={}", resource.getId());
                return Result.error("更新资源失败", 500);
            }

            log.info("角色生成任务创建成功: resourceId={}, generationTaskId={}",
                    resource.getId(), generationTaskId);

            Map<String, Object> data = buildResourceResponse(resource);
            data.put("generationTaskId", generationTaskId);

            return Result.success(data, "角色生成任务创建成功");

        } catch (IllegalArgumentException e) {
            log.error("参数验证失败: {}", e.getMessage());
            return Result.error(e.getMessage(), 400);
        } catch (Exception e) {
            log.error("创建角色生成任务失败: {}", e.getMessage(), e);
            return Result.error("创建任务失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取资源详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取资源详情")
    public Result<?> getResource(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            VideoResource resource = videoResourceMapper.selectById(id);
            if (resource == null) {
                return Result.error("资源不存在", 404);
            }
            if (!resource.getUserId().equals(userId)) {
                return Result.error("无权访问此资源", 403);
            }

            // 如果资源状态是角色生成中，主动查询三方接口刷新状态
            if (VideoResource.Status.CHARACTER_GENERATING.equals(resource.getStatus())
                    && StrUtil.isNotBlank(resource.getGenerationTaskId())) {
                try {
                    JSONObject response = characterService.queryTaskStatus(
                            resource.getSiteId(), resource.getGenerationTaskId());

                    if (response != null) {
                        // 检查是否完成
                        if (characterService.isTaskCompleted(response)) {
                            // 提取角色ID和图片URL
                            String characterId = response.getString("id");
                            String imageUrl = response.getString("image_url");

                            resource.setCharacterId(characterId);
                            if (StrUtil.isNotBlank(imageUrl)) {
                                resource.setCharacterImageUrl(imageUrl);
                            }
                            resource.setStatus(VideoResource.Status.COMPLETED);
                            resource.setCompletedAt(java.time.LocalDateTime.now());

                            // 保存结果数据
                            resource.setResultData(response.toJSONString());

                            videoResourceMapper.updateById(resource);
                            log.info("角色生成完成: resourceId={}, characterId={}",
                                    resource.getId(), characterId);

                        } else if (characterService.isTaskFailed(response)) {
                            String errorMessage = characterService.extractErrorMessage(response);
                            resource.setStatus(VideoResource.Status.FAILED);
                            resource.setErrorMessage(errorMessage);
                            resource.setCompletedAt(java.time.LocalDateTime.now());

                            videoResourceMapper.updateById(resource);
                            log.error("角色生成失败: resourceId={}, error={}",
                                    resource.getId(), errorMessage);
                        }
                        // 如果仍在处理中，不更新状态
                    }
                } catch (Exception e) {
                    log.warn("查询角色生成状态失败: resourceId={}, error={}",
                            resource.getId(), e.getMessage());
                    // 继续返回当前数据库中的状态
                }
            }

            return Result.success(buildResourceResponse(resource));

        } catch (Exception e) {
            log.error("查询资源失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取项目的资源列表
     */
    @GetMapping("/project/{projectId}")
    @Operation(summary = "获取项目的资源列表")
    public Result<?> getProjectResources(
            @PathVariable Long projectId,
            @RequestParam(required = false) String resourceType
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            // 验证项目权限
            WorkflowProject project = workflowProjectMapper.selectById(projectId);
            if (project == null) {
                return Result.error("项目不存在", 404);
            }
            if (!project.getUserId().equals(userId)) {
                return Result.error("无权访问此项目", 403);
            }

            List<VideoResource> resources;
            if (StrUtil.isNotBlank(resourceType)) {
                resources = videoResourceMapper.selectByProjectIdAndType(projectId, resourceType);
            } else {
                resources = videoResourceMapper.selectByProjectId(projectId);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("projectId", projectId);
            data.put("resources", resources);
            data.put("total", resources.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("查询项目资源列表失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取剧本的资源列表
     */
    @GetMapping("/script/{scriptId}")
    @Operation(summary = "获取剧本的资源列表")
    public Result<?> getScriptResources(
            @PathVariable Long scriptId,
            @RequestParam(required = false) String resourceType
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            // 验证剧本权限（创建者或成员都可以访问）
            Script script = scriptMapper.selectById(scriptId);
            if (script == null) {
                return Result.error("剧本不存在", 404);
            }
            // 检查用户是否是剧本的创建者或成员
            if (!scriptMemberMapper.existsByScriptIdAndUserId(scriptId, userId)) {
                return Result.error("无权访问此剧本", 403);
            }

            List<VideoResource> resources;
            if (StrUtil.isNotBlank(resourceType)) {
                resources = videoResourceMapper.selectByScriptIdAndType(scriptId, resourceType);
            } else {
                resources = videoResourceMapper.selectByScriptId(scriptId);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("scriptId", scriptId);
            data.put("scriptName", script.getName());
            data.put("resources", resources);
            data.put("total", resources.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("查询剧本资源列表失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取资源列表（分页）
     */
    @GetMapping("/list")
    @Operation(summary = "获取资源列表（分页）")
    public Result<?> getResources(@Valid TaskQueryRequest request) {
        request.validateAndCorrect();
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            LambdaQueryWrapper<VideoResource> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(VideoResource::getUserId, userId);

            if (StrUtil.isNotBlank(request.getStatus())) {
                queryWrapper.eq(VideoResource::getStatus, request.getStatus());
            }

            queryWrapper.orderByDesc(VideoResource::getCreatedAt);

            Page<VideoResource> pageParam = new Page<>(request.getPage(), request.getPageSize());
            IPage<VideoResource> pageResult = videoResourceMapper.selectPage(pageParam, queryWrapper);

            return Result.success(PageResult.of(pageResult));

        } catch (Exception e) {
            log.error("查询资源列表失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 更新资源信息
     */
    @PostMapping("/update/{id}")
    @Operation(summary = "更新资源信息")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> updateResource(@PathVariable Long id, @RequestBody Map<String, Object> updateData) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            VideoResource resource = videoResourceMapper.selectById(id);
            if (resource == null) {
                return Result.error("资源不存在", 404);
            }
            if (!resource.getUserId().equals(userId)) {
                return Result.error("无权修改此资源", 403);
            }

            // 更新资源名称
            if (updateData.containsKey("resourceName")) {
                String resourceName = (String) updateData.get("resourceName");
                if (StrUtil.isBlank(resourceName)) {
                    return Result.error("资源名称不能为空", 400);
                }

                String trimmedName = resourceName.trim();
                if (!trimmedName.equals(resource.getResourceName())) {
                    trimmedName = generateUniqueResourceName(
                            trimmedName,
                            resource.getWorkflowProjectId(),
                            resource.getScriptId(),
                            id
                    );
                }
                resource.setResourceName(trimmedName);
            }

            // 更新资源类型
            if (updateData.containsKey("resourceType")) {
                String resourceType = (String) updateData.get("resourceType");
                if (StrUtil.isNotBlank(resourceType)) {
                    resource.setResourceType(resourceType);
                }
            }

            // 更新提示词
            if (updateData.containsKey("prompt")) {
                resource.setPrompt((String) updateData.get("prompt"));
            }

            // 更新视频尺寸
            if (updateData.containsKey("aspectRatio")) {
                resource.setAspectRatio((String) updateData.get("aspectRatio"));
            }

            // 更新状态
            if (updateData.containsKey("status")) {
                String status = (String) updateData.get("status");
                if (StrUtil.isNotBlank(status)) {
                    resource.setStatus(status);
                }
            }

            // 更新视频任务ID
            if (updateData.containsKey("videoTaskId")) {
                resource.setVideoTaskId((String) updateData.get("videoTaskId"));
            }

            // 更新视频URL
            if (updateData.containsKey("videoUrl")) {
                resource.setVideoUrl((String) updateData.get("videoUrl"));
            }

            // 更新视频结果URL
            if (updateData.containsKey("videoResultUrl")) {
                resource.setVideoResultUrl((String) updateData.get("videoResultUrl"));
            }

            // 更新错误信息
            if (updateData.containsKey("errorMessage")) {
                resource.setErrorMessage((String) updateData.get("errorMessage"));
            }

            // 如果状态变为完成，设置完成时间
            if (VideoResource.Status.COMPLETED.equals(resource.getStatus()) && resource.getCompletedAt() == null) {
                resource.setCompletedAt(java.time.LocalDateTime.now());
            }

            int result = videoResourceMapper.updateById(resource);
            if (result <= 0) {
                log.error("更新资源失败: id={}", id);
                return Result.error("更新失败", 500);
            }

            log.info("资源信息更新成功: id={}, resourceName={}", id, resource.getResourceName());

            return Result.success(buildResourceResponse(resource), "更新成功");

        } catch (Exception e) {
            log.error("更新资源失败: {}", e.getMessage(), e);
            return Result.error("更新失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 删除资源
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除资源")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> deleteResource(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            VideoResource resource = videoResourceMapper.selectById(id);
            if (resource == null) {
                return Result.error("资源不存在", 404);
            }
            if (!resource.getUserId().equals(userId)) {
                return Result.error("无权删除此资源", 403);
            }

            videoResourceMapper.deleteById(id);

            return Result.success(null, "删除成功");

        } catch (Exception e) {
            log.error("删除资源失败: {}", e.getMessage(), e);
            return Result.error("删除失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 复制资源到其他剧本
     */
    @PostMapping("/{id}/copy")
    @Operation(summary = "复制资源到其他剧本")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> copyResource(
            @PathVariable Long id,
            @Valid @RequestBody VideoResourceCopyRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            // 验证源资源
            VideoResource sourceResource = videoResourceMapper.selectById(id);
            if (sourceResource == null) {
                return Result.error("资源不存在", 404);
            }
            if (!sourceResource.getUserId().equals(userId)) {
                return Result.error("无权复制此资源", 403);
            }

            // 验证目标剧本
            Script targetScript = scriptMapper.selectById(request.getTargetScriptId());
            if (targetScript == null) {
                return Result.error("目标剧本不存在", 404);
            }
            if (!targetScript.getUserId().equals(userId)) {
                return Result.error("无权访问目标剧本", 403);
            }

            // 确定新资源名称
            String newResourceName = StrUtil.isNotBlank(request.getNewResourceName())
                    ? request.getNewResourceName().trim()
                    : sourceResource.getResourceName();

            // 检查目标剧本中是否已存在同名资源
            LambdaQueryWrapper<VideoResource> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(VideoResource::getScriptId, request.getTargetScriptId())
                    .eq(VideoResource::getResourceName, newResourceName);
            Long count = videoResourceMapper.selectCount(queryWrapper);
            if (count > 0) {
                newResourceName = newResourceName + " (副本)";
            }

            // 创建资源副本
            VideoResource newResource = new VideoResource();
            newResource.setUserId(userId);
            newResource.setSiteId(sourceResource.getSiteId());
            newResource.setScriptId(request.getTargetScriptId());
            newResource.setWorkflowProjectId(null);
            newResource.setResourceName(newResourceName);
            newResource.setResourceType(sourceResource.getResourceType());
            newResource.setPrompt(sourceResource.getPrompt());
            newResource.setVideoTaskId(sourceResource.getVideoTaskId());
            newResource.setVideoUrl(sourceResource.getVideoUrl());
            newResource.setVideoResultUrl(sourceResource.getVideoResultUrl());
            newResource.setStartTime(sourceResource.getStartTime());
            newResource.setEndTime(sourceResource.getEndTime());
            newResource.setTimestamps(sourceResource.getTimestamps());
            newResource.setGenerationTaskId(sourceResource.getGenerationTaskId());
            newResource.setCharacterId(sourceResource.getCharacterId());
            newResource.setCharacterImageUrl(sourceResource.getCharacterImageUrl());
            newResource.setCharacterVideoUrl(sourceResource.getCharacterVideoUrl());
            newResource.setStatus(sourceResource.getStatus());
            newResource.setIsRealPerson(sourceResource.getIsRealPerson());
            newResource.setResultData(sourceResource.getResultData());

            int result = videoResourceMapper.insert(newResource);
            if (result <= 0) {
                log.error("复制资源失败: source_id={}", id);
                return Result.error("复制资源失败", 500);
            }

            log.info("资源复制成功: source_id={}, new_id={}, target_script_id={}",
                    id, newResource.getId(), request.getTargetScriptId());

            Map<String, Object> data = new HashMap<>();
            data.put("id", newResource.getId());
            data.put("resourceName", newResource.getResourceName());
            data.put("scriptId", newResource.getScriptId());
            data.put("scriptName", targetScript.getName());

            return Result.success(data, "资源复制成功");

        } catch (Exception e) {
            log.error("复制资源失败: {}", e.getMessage(), e);
            return Result.error("复制失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 生成唯一的资源名称
     */
    private String generateUniqueResourceName(String baseName, Long projectId, Long scriptId, Long excludeId) {
        String candidateName = baseName;
        int maxAttempts = 10;

        for (int i = 0; i < maxAttempts; i++) {
            LambdaQueryWrapper<VideoResource> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(VideoResource::getResourceName, candidateName);

            if (scriptId != null) {
                queryWrapper.eq(VideoResource::getScriptId, scriptId);
            } else if (projectId != null) {
                queryWrapper.eq(VideoResource::getWorkflowProjectId, projectId);
            } else {
                return candidateName;
            }

            if (excludeId != null) {
                queryWrapper.ne(VideoResource::getId, excludeId);
            }

            Long count = videoResourceMapper.selectCount(queryWrapper);
            if (count == 0) {
                return candidateName;
            }

            candidateName = baseName + "_" + generateRandomSuffix(4);
        }

        return baseName + "_" + System.currentTimeMillis();
    }

    /**
     * 生成随机后缀
     */
    private String generateRandomSuffix(int length) {
        String chars = "abcdefghijklmnopqrstuvwxyz";
        Random random = new Random();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    /**
     * 构建资源响应数据
     */
    private Map<String, Object> buildResourceResponse(VideoResource resource) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", resource.getId());
        data.put("resourceName", resource.getResourceName());
        data.put("resourceType", resource.getResourceType());
        data.put("prompt", resource.getPrompt());
        data.put("aspectRatio", resource.getAspectRatio());
        data.put("videoTaskId", resource.getVideoTaskId());
        data.put("videoUrl", resource.getVideoUrl());
        data.put("videoResultUrl", resource.getVideoResultUrl());
        data.put("startTime", resource.getStartTime());
        data.put("endTime", resource.getEndTime());
        data.put("timestamps", resource.getTimestamps());
        data.put("generationTaskId", resource.getGenerationTaskId());
        data.put("characterId", resource.getCharacterId());
        data.put("characterImageUrl", resource.getCharacterImageUrl());
        data.put("characterVideoUrl", resource.getCharacterVideoUrl());
        data.put("status", resource.getStatus());
        data.put("errorMessage", resource.getErrorMessage());
        data.put("isRealPerson", resource.getIsRealPerson());
        data.put("resultData", resource.getResultData());
        data.put("projectId", resource.getWorkflowProjectId());
        data.put("scriptId", resource.getScriptId());
        data.put("createdAt", resource.getCreatedAt());
        data.put("updatedAt", resource.getUpdatedAt());
        data.put("completedAt", resource.getCompletedAt());
        data.put("characterRequestedAt", resource.getCharacterRequestedAt());
        return data;
    }
}
