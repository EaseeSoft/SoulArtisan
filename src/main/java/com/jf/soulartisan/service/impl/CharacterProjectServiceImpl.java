package com.jf.soulartisan.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.dto.characterproject.*;
import com.jf.soulartisan.entity.*;
import com.jf.soulartisan.mapper.*;
import com.jf.soulartisan.service.CharacterProjectService;
import com.jf.soulartisan.service.GeminiChatService;
import com.jf.soulartisan.service.SoraService;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 角色项目服务实现
 */
@Slf4j
@Service
public class CharacterProjectServiceImpl extends ServiceImpl<CharacterProjectMapper, CharacterProject>
        implements CharacterProjectService {

    @Resource
    private CharacterProjectMapper characterProjectMapper;

    @Resource
    private CharacterProjectResourceMapper characterProjectResourceMapper;

    @Resource
    private CharacterProjectStoryboardMapper characterProjectStoryboardMapper;

    @Resource
    private CharacterProjectStoryboardResourceMapper characterProjectStoryboardResourceMapper;

    @Resource
    private CharacterProjectStoryboardVideoMapper characterProjectStoryboardVideoMapper;

    @Resource
    private VideoResourceMapper videoResourceMapper;

    @Resource
    private ScriptMapper scriptMapper;

    @Resource
    private VideoGenerationTaskMapper videoGenerationTaskMapper;

    @Resource
    private GeminiChatService geminiChatService;

    @Resource
    private SoraService soraService;

    /**
     * 从AI响应中提取纯JSON内容
     * 去除markdown代码块标记和前后所有无关文字
     *
     * @param response AI响应内容
     * @return 提取的纯JSON字符串
     */
    private String extractJsonFromResponse(String response) {
        if (StrUtil.isBlank(response)) {
            return response;
        }
        String cleaned = response.trim();

        // 先尝试移除markdown代码块标记
        if (cleaned.contains("```")) {
            // 查找代码块内容
            int startIdx = cleaned.indexOf("```");
            if (startIdx != -1) {
                int contentStart = cleaned.indexOf("\n", startIdx);
                if (contentStart != -1) {
                    int endIdx = cleaned.indexOf("```", contentStart);
                    if (endIdx != -1) {
                        cleaned = cleaned.substring(contentStart + 1, endIdx).trim();
                    }
                }
            }
        }

        // 检测并提取JSON数组 [...]
        int arrayStart = cleaned.indexOf('[');
        int arrayEnd = cleaned.lastIndexOf(']');
        if (arrayStart != -1 && arrayEnd != -1 && arrayEnd > arrayStart) {
            return cleaned.substring(arrayStart, arrayEnd + 1);
        }

        // 检测并提取JSON对象 {...}
        int objStart = cleaned.indexOf('{');
        int objEnd = cleaned.lastIndexOf('}');
        if (objStart != -1 && objEnd != -1 && objEnd > objStart) {
            return cleaned.substring(objStart, objEnd + 1);
        }

        return cleaned;
    }

    // ==================== 项目管理 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CharacterProject createProject(Long userId, Long siteId, CreateCharacterProjectRequest request) {
        CharacterProject project = new CharacterProject();
        project.setUserId(userId);
        project.setSiteId(siteId);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setScriptId(request.getScriptId());
        project.setCurrentStep(CharacterProject.Step.INPUT_SCRIPT);
        project.setStatus(CharacterProject.Status.DRAFT);

        // 如果指定了剧本ID，从剧本获取风格
        if (request.getScriptId() != null) {
            Script script = scriptMapper.selectById(request.getScriptId());
            if (script != null) {
                project.setStyle(script.getStyle());
            } else if (StrUtil.isNotBlank(request.getStyle())) {
                project.setStyle(request.getStyle());
            }
        } else if (StrUtil.isNotBlank(request.getStyle())) {
            project.setStyle(request.getStyle());
        }

        int result = characterProjectMapper.insert(project);
        if (result <= 0) {
            throw new ServiceException("创建项目失败");
        }

        log.info("角色项目创建成功: id={}, name={}, userId={}", project.getId(), project.getName(), userId);
        return project;
    }

    @Override
    public CharacterProject getProjectById(Long projectId, Long userId) {
        CharacterProject project = characterProjectMapper.selectById(projectId);
        if (project == null) {
            throw new ServiceException("项目不存在");
        }
        if (!project.getUserId().equals(userId)) {
            throw new ServiceException("无权访问此项目");
        }
        return project;
    }

    @Override
    public Page<CharacterProject> listProjects(Long userId, Integer page, Integer pageSize) {
        LambdaQueryWrapper<CharacterProject> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(CharacterProject::getUserId, userId)
                .orderByDesc(CharacterProject::getCreatedAt);

        Page<CharacterProject> pageParam = new Page<>(page, pageSize);
        return characterProjectMapper.selectPage(pageParam, queryWrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CharacterProject updateProject(Long projectId, Long userId, UpdateCharacterProjectRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        if (StrUtil.isNotBlank(request.getName())) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getCurrentStep() != null) {
            project.setCurrentStep(request.getCurrentStep());
        }
        if (StrUtil.isNotBlank(request.getStatus())) {
            project.setStatus(request.getStatus());
        }

        int result = characterProjectMapper.updateById(project);
        if (result <= 0) {
            throw new ServiceException("更新项目失败");
        }

        log.info("角色项目更新成功: id={}, name={}", project.getId(), project.getName());
        return project;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteProject(Long projectId, Long userId) {
        CharacterProject project = getProjectById(projectId, userId);

        // 删除关联的分镜资源关联
        List<CharacterProjectStoryboard> storyboards = characterProjectStoryboardMapper.selectByProjectId(projectId);
        for (CharacterProjectStoryboard storyboard : storyboards) {
            characterProjectStoryboardResourceMapper.deleteByStoryboardId(storyboard.getId());
        }

        // 删除分镜
        characterProjectStoryboardMapper.deleteByProjectId(projectId);

        // 删除提取创建的资源
        List<CharacterProjectResource> relations = characterProjectResourceMapper.selectByProjectId(projectId);
        for (CharacterProjectResource relation : relations) {
            if (CharacterProjectResource.SourceType.EXTRACT.equals(relation.getSourceType())) {
                videoResourceMapper.deleteById(relation.getResourceId());
            }
        }

        // 删除项目资源关联
        characterProjectResourceMapper.deleteByProjectId(projectId);

        // 删除项目
        characterProjectMapper.deleteById(projectId);

        log.info("角色项目删除成功: id={}, name={}", projectId, project.getName());
    }

    // ==================== 步骤1：输入剧本 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CharacterProject saveScript(Long projectId, Long userId, SaveScriptRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        project.setScriptContent(request.getScriptContent());
        if (StrUtil.isNotBlank(request.getStyle())) {
            project.setStyle(request.getStyle());
        }
        project.setCurrentStep(CharacterProject.Step.EXTRACT_RESOURCES);
        project.setStatus(CharacterProject.Status.IN_PROGRESS);

        int result = characterProjectMapper.updateById(project);
        if (result <= 0) {
            throw new ServiceException("保存剧本失败");
        }

        log.info("剧本保存成功: projectId={}", projectId);
        return project;
    }

    // ==================== 步骤2:资源管理 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<VideoResource> batchCreateResources(Long projectId, Long userId, Long siteId,
                                                    BatchCreateResourceRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        List<VideoResource> createdResources = new ArrayList<>();
        int maxSortOrder = characterProjectResourceMapper.getMaxSortOrder(projectId);

        for (BatchCreateResourceRequest.ResourceItem item : request.getResources()) {
            // 创建 VideoResource
            VideoResource resource = new VideoResource();
            resource.setUserId(userId);
            resource.setSiteId(siteId);
            resource.setScriptId(project.getScriptId());
            resource.setResourceName(item.getResourceName());
            resource.setResourceType(StrUtil.isNotBlank(item.getResourceType())
                    ? item.getResourceType() : VideoResource.ResourceType.CHARACTER);
            resource.setPrompt(item.getPrompt());
            resource.setCharacterImageUrl(item.getImageUrl());
            resource.setStatus(StrUtil.isNotBlank(item.getImageUrl())
                    ? VideoResource.Status.COMPLETED : VideoResource.Status.NOT_GENERATED);

            int result = videoResourceMapper.insert(resource);
            if (result > 0) {
                // 创建关联记录（标记为提取创建）
                CharacterProjectResource relation = new CharacterProjectResource();
                relation.setProjectId(projectId);
                relation.setResourceId(resource.getId());
                relation.setSourceType(CharacterProjectResource.SourceType.EXTRACT);
                relation.setSortOrder(++maxSortOrder);
                characterProjectResourceMapper.insert(relation);

                createdResources.add(resource);
            }
        }

        log.info("批量创建资源成功: projectId={}, count={}", projectId, createdResources.size());
        return createdResources;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void bindResources(Long projectId, Long userId, BindResourcesRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        int maxSortOrder = characterProjectResourceMapper.getMaxSortOrder(projectId);

        for (Long resourceId : request.getResourceIds()) {
            // 检查资源是否存在
            VideoResource resource = videoResourceMapper.selectById(resourceId);
            if (resource == null) {
                log.warn("资源不存在: resourceId={}", resourceId);
                continue;
            }

            // 检查是否已绑定
            CharacterProjectResource existing = characterProjectResourceMapper
                    .selectByProjectIdAndResourceId(projectId, resourceId);
            if (existing != null) {
                log.warn("资源已绑定: projectId={}, resourceId={}", projectId, resourceId);
                continue;
            }

            // 创建绑定关系
            CharacterProjectResource relation = new CharacterProjectResource();
            relation.setProjectId(projectId);
            relation.setResourceId(resourceId);
            relation.setSourceType(CharacterProjectResource.SourceType.SCRIPT);
            relation.setSourceScriptId(request.getScriptId());
            relation.setSortOrder(++maxSortOrder);
            characterProjectResourceMapper.insert(relation);
        }

        log.info("绑定资源成功: projectId={}, count={}", projectId, request.getResourceIds().size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unbindResource(Long projectId, Long userId, Long resourceId) {
        CharacterProject project = getProjectById(projectId, userId);

        CharacterProjectResource relation = characterProjectResourceMapper
                .selectByProjectIdAndResourceId(projectId, resourceId);
        if (relation == null) {
            throw new ServiceException("资源未绑定到该项目");
        }

        // 删除关联关系
        characterProjectResourceMapper.deleteById(relation.getId());

        // 如果是提取创建的资源，同时删除资源记录
        if (CharacterProjectResource.SourceType.EXTRACT.equals(relation.getSourceType())) {
            videoResourceMapper.deleteById(resourceId);
            log.info("删除提取创建的资源: resourceId={}", resourceId);
        }

        log.info("解绑资源成功: projectId={}, resourceId={}", projectId, resourceId);
    }

    @Override
    public List<Map<String, Object>> getProjectResources(Long projectId, Long userId) {
        CharacterProject project = getProjectById(projectId, userId);

        List<CharacterProjectResource> relations = characterProjectResourceMapper.selectByProjectId(projectId);
        List<Map<String, Object>> results = new ArrayList<>();

        for (CharacterProjectResource relation : relations) {
            VideoResource resource = videoResourceMapper.selectById(relation.getResourceId());
            if (resource == null) {
                continue;
            }

            // 与 VideoResourceController.buildResourceResponse 保持一致的字段
            Map<String, Object> item = new HashMap<>();
            item.put("id", resource.getId());
            item.put("resourceName", resource.getResourceName());
            item.put("resourceType", resource.getResourceType());
            item.put("prompt", resource.getPrompt());
            item.put("aspectRatio", resource.getAspectRatio());
            item.put("videoTaskId", resource.getVideoTaskId());
            item.put("videoUrl", resource.getVideoUrl());
            item.put("videoResultUrl", resource.getVideoResultUrl());
            item.put("startTime", resource.getStartTime());
            item.put("endTime", resource.getEndTime());
            item.put("timestamps", resource.getTimestamps());
            item.put("generationTaskId", resource.getGenerationTaskId());
            item.put("characterId", resource.getCharacterId());
            item.put("characterImageUrl", resource.getCharacterImageUrl());
            item.put("characterVideoUrl", resource.getCharacterVideoUrl());
            item.put("status", resource.getStatus());
            item.put("errorMessage", resource.getErrorMessage());
            item.put("isRealPerson", resource.getIsRealPerson());
            item.put("resultData", resource.getResultData());
            item.put("projectId", resource.getWorkflowProjectId());
            item.put("scriptId", resource.getScriptId());
            item.put("createdAt", resource.getCreatedAt());
            item.put("updatedAt", resource.getUpdatedAt());
            item.put("completedAt", resource.getCompletedAt());
            item.put("characterRequestedAt", resource.getCharacterRequestedAt());

            // 角色项目特有的额外字段
            item.put("sourceType", relation.getSourceType());
            item.put("sourceScriptId", relation.getSourceScriptId());
            item.put("sortOrder", relation.getSortOrder());

            // 如果是从剧本选择，查询剧本名称
            if (relation.getSourceScriptId() != null) {
                Script script = scriptMapper.selectById(relation.getSourceScriptId());
                if (script != null) {
                    item.put("sourceScriptName", script.getName());
                }
            }

            results.add(item);
        }

        return results;
    }

    @Override
    public Map<String, Object> getAvailableResources(Long projectId, Long userId, Long scriptId) {
        CharacterProject project = getProjectById(projectId, userId);

        Script script = scriptMapper.selectById(scriptId);
        if (script == null) {
            throw new ServiceException("剧本不存在");
        }

        // 获取剧本下的所有资源
        List<VideoResource> resources = videoResourceMapper.selectByScriptId(scriptId);

        // 获取已绑定的资源ID集合
        List<CharacterProjectResource> relations = characterProjectResourceMapper.selectByProjectId(projectId);
        Set<Long> boundResourceIds = relations.stream()
                .map(CharacterProjectResource::getResourceId)
                .collect(Collectors.toSet());

        List<Map<String, Object>> resourceList = new ArrayList<>();
        for (VideoResource resource : resources) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", resource.getId());
            item.put("resourceName", resource.getResourceName());
            item.put("resourceType", resource.getResourceType());
            item.put("status", resource.getStatus());
            item.put("alreadyBound", boundResourceIds.contains(resource.getId()));
            resourceList.add(item);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("scriptId", scriptId);
        result.put("scriptName", script.getName());
        result.put("resources", resourceList);

        return result;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public VideoResource generateResourceVideo(Long projectId, Long userId, Long resourceId,
                                               GenerateResourceRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        // 验证资源是否属于该项目
        CharacterProjectResource relation = characterProjectResourceMapper
                .selectByProjectIdAndResourceId(projectId, resourceId);
        if (relation == null) {
            throw new ServiceException("资源不属于该项目");
        }

        VideoResource resource = videoResourceMapper.selectById(resourceId);
        if (resource == null) {
            throw new ServiceException("资源不存在");
        }

        // TODO: 调用视频生成服务生成角色视频
        // 这里需要根据实际的视频生成API来实现

        log.info("生成资源视频: projectId={}, resourceId={}", projectId, resourceId);
        return resource;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteResource(Long projectId, Long userId, Long resourceId) {
        unbindResource(projectId, userId, resourceId);
    }

    // ==================== 步骤3：分镜管理 ====================

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<CharacterProjectStoryboard> batchCreateStoryboards(Long projectId, Long userId, Long siteId,
                                                                   BatchCreateStoryboardRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        List<CharacterProjectStoryboard> createdStoryboards = new ArrayList<>();

        for (BatchCreateStoryboardRequest.StoryboardItem item : request.getStoryboards()) {
            // 创建分镜
            CharacterProjectStoryboard storyboard = new CharacterProjectStoryboard();
            storyboard.setProjectId(projectId);
            storyboard.setUserId(userId);
            storyboard.setSiteId(siteId);
            storyboard.setSceneNumber(item.getSceneNumber());
            storyboard.setSceneName(item.getSceneName());
            storyboard.setSceneDescription(item.getSceneDescription());
            storyboard.setStatus(CharacterProjectStoryboard.Status.PENDING);

            int result = characterProjectStoryboardMapper.insert(storyboard);
            if (result > 0) {
                // 创建分镜资源关联
                if (item.getResources() != null && !item.getResources().isEmpty()) {
                    int sortOrder = 0;
                    for (BatchCreateStoryboardRequest.ResourceBinding resourceItem : item.getResources()) {
                        CharacterProjectStoryboardResource relation = new CharacterProjectStoryboardResource();
                        relation.setStoryboardId(storyboard.getId());
                        relation.setResourceId(resourceItem.getResourceId());
                        relation.setResourceRole(resourceItem.getResourceRole());
                        relation.setSortOrder(sortOrder++);
                        characterProjectStoryboardResourceMapper.insert(relation);
                    }
                }

                createdStoryboards.add(storyboard);
            }
        }

        // 更新项目步骤
        if (!createdStoryboards.isEmpty()) {
            project.setCurrentStep(CharacterProject.Step.CREATE_STORYBOARDS);
            characterProjectMapper.updateById(project);
        }

        log.info("批量创建分镜成功: projectId={}, count={}", projectId, createdStoryboards.size());
        return createdStoryboards;
    }

    @Override
    public List<Map<String, Object>> getProjectStoryboards(Long projectId, Long userId) {
        CharacterProject project = getProjectById(projectId, userId);

        List<CharacterProjectStoryboard> storyboards = characterProjectStoryboardMapper.selectByProjectId(projectId);
        List<Map<String, Object>> results = new ArrayList<>();

        for (CharacterProjectStoryboard storyboard : storyboards) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", storyboard.getId());
            item.put("sceneNumber", storyboard.getSceneNumber());
            item.put("sceneName", storyboard.getSceneName());
            item.put("sceneDescription", storyboard.getSceneDescription());
            item.put("videoPrompt", storyboard.getVideoPrompt());
            item.put("status", storyboard.getStatus());
            item.put("videoUrl", storyboard.getVideoUrl());
            item.put("errorMessage", storyboard.getErrorMessage());
            item.put("createdAt", storyboard.getCreatedAt());
            item.put("updatedAt", storyboard.getUpdatedAt());

            // 获取关联资源
            List<CharacterProjectStoryboardResource> relations =
                    characterProjectStoryboardResourceMapper.selectByStoryboardId(storyboard.getId());
            List<Map<String, Object>> resources = new ArrayList<>();
            for (CharacterProjectStoryboardResource relation : relations) {
                VideoResource resource = videoResourceMapper.selectById(relation.getResourceId());
                if (resource != null) {
                    Map<String, Object> resourceInfo = new HashMap<>();
                    resourceInfo.put("resourceId", resource.getId());
                    resourceInfo.put("resourceName", resource.getResourceName());
                    resourceInfo.put("resourceType", resource.getResourceType());
                    resourceInfo.put("resourceRole", relation.getResourceRole());
                    resourceInfo.put("characterImageUrl", resource.getCharacterImageUrl());
                    resourceInfo.put("characterId", resource.getCharacterId());
                    resources.add(resourceInfo);
                }
            }
            item.put("resources", resources);

            // 获取分镜关联的视频列表
            List<CharacterProjectStoryboardVideo> storyboardVideos =
                    characterProjectStoryboardVideoMapper.selectByStoryboardId(storyboard.getId());
            List<Map<String, Object>> videos = new ArrayList<>();
            for (CharacterProjectStoryboardVideo video : storyboardVideos) {
                Map<String, Object> videoInfo = new HashMap<>();
                videoInfo.put("id", video.getId());
                videoInfo.put("taskId", video.getTaskId());
                videoInfo.put("videoUrl", video.getVideoUrl());
                videoInfo.put("prompt", video.getPrompt());
                videoInfo.put("aspectRatio", video.getAspectRatio());
                videoInfo.put("duration", video.getDuration());
                videoInfo.put("status", video.getStatus());
                videoInfo.put("errorMessage", video.getErrorMessage());
                videoInfo.put("createdAt", video.getCreatedAt());
                videos.add(videoInfo);
            }
            item.put("videos", videos);

            results.add(item);
        }

        return results;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void bindStoryboardResources(Long projectId, Long userId, Long storyboardId,
                                        BindStoryboardResourcesRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        CharacterProjectStoryboard storyboard = characterProjectStoryboardMapper.selectById(storyboardId);
        if (storyboard == null || !storyboard.getProjectId().equals(projectId)) {
            throw new ServiceException("分镜不存在或不属于该项目");
        }

        // 删除现有关联
        characterProjectStoryboardResourceMapper.deleteByStoryboardId(storyboardId);

        // 创建新关联
        int sortOrder = 0;
        for (BindStoryboardResourcesRequest.ResourceBinding item : request.getResources()) {
            CharacterProjectStoryboardResource relation = new CharacterProjectStoryboardResource();
            relation.setStoryboardId(storyboardId);
            relation.setResourceId(item.getResourceId());
            relation.setResourceRole(item.getResourceRole());
            relation.setSortOrder(sortOrder++);
            characterProjectStoryboardResourceMapper.insert(relation);
        }

        log.info("绑定分镜资源成功: storyboardId={}, count={}", storyboardId, request.getResources().size());
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void unbindStoryboardResource(Long projectId, Long userId, Long storyboardId, Long resourceId) {
        CharacterProject project = getProjectById(projectId, userId);

        CharacterProjectStoryboard storyboard = characterProjectStoryboardMapper.selectById(storyboardId);
        if (storyboard == null || !storyboard.getProjectId().equals(projectId)) {
            throw new ServiceException("分镜不存在或不属于该项目");
        }

        int deleted = characterProjectStoryboardResourceMapper
                .deleteByStoryboardIdAndResourceId(storyboardId, resourceId);
        if (deleted <= 0) {
            throw new ServiceException("资源未绑定到该分镜");
        }

        log.info("解绑分镜资源成功: storyboardId={}, resourceId={}", storyboardId, resourceId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CharacterProjectStoryboard generateStoryboardVideo(Long projectId, Long userId, Long storyboardId) {
        CharacterProject project = getProjectById(projectId, userId);

        CharacterProjectStoryboard storyboard = characterProjectStoryboardMapper.selectById(storyboardId);
        if (storyboard == null || !storyboard.getProjectId().equals(projectId)) {
            throw new ServiceException("分镜不存在或不属于该项目");
        }

        // TODO: 调用视频生成服务
        // 这里需要根据实际的视频生成API来实现

        log.info("生成分镜视频: projectId={}, storyboardId={}", projectId, storyboardId);
        return storyboard;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public List<CharacterProjectStoryboard> batchGenerateStoryboardVideos(Long projectId, Long userId,
                                                                          BatchGenerateStoryboardsRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        List<CharacterProjectStoryboard> storyboards = new ArrayList<>();
        for (Long storyboardId : request.getStoryboardIds()) {
            try {
                CharacterProjectStoryboard storyboard = generateStoryboardVideo(projectId, userId, storyboardId);
                storyboards.add(storyboard);
            } catch (Exception e) {
                log.error("生成分镜视频失败: storyboardId={}, error={}", storyboardId, e.getMessage());
            }
        }

        log.info("批量生成分镜视频: projectId={}, count={}", projectId, storyboards.size());
        return storyboards;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CharacterProjectStoryboard updateStoryboard(Long projectId, Long userId, Long storyboardId,
                                                       UpdateStoryboardRequest request) {
        CharacterProject project = getProjectById(projectId, userId);

        CharacterProjectStoryboard storyboard = characterProjectStoryboardMapper.selectById(storyboardId);
        if (storyboard == null || !storyboard.getProjectId().equals(projectId)) {
            throw new ServiceException("分镜不存在或不属于该项目");
        }

        // 更新字段
        if (request.getSceneName() != null) {
            storyboard.setSceneName(request.getSceneName());
        }
        if (request.getSceneDescription() != null) {
            storyboard.setSceneDescription(request.getSceneDescription());
        }
        if (request.getVideoPrompt() != null) {
            storyboard.setVideoPrompt(request.getVideoPrompt());
        }

        characterProjectStoryboardMapper.updateById(storyboard);

        log.info("更新分镜成功: projectId={}, storyboardId={}", projectId, storyboardId);
        return storyboard;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteStoryboard(Long projectId, Long userId, Long storyboardId) {
        CharacterProject project = getProjectById(projectId, userId);

        CharacterProjectStoryboard storyboard = characterProjectStoryboardMapper.selectById(storyboardId);
        if (storyboard == null || !storyboard.getProjectId().equals(projectId)) {
            throw new ServiceException("分镜不存在或不属于该项目");
        }

        // 删除分镜资源关联
        characterProjectStoryboardResourceMapper.deleteByStoryboardId(storyboardId);

        // 删除分镜
        characterProjectStoryboardMapper.deleteById(storyboardId);

        log.info("删除分镜成功: projectId={}, storyboardId={}", projectId, storyboardId);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void syncStoryboardStatus(Long taskId, String status, String videoUrl, String errorMessage) {
        VideoGenerationTask task = videoGenerationTaskMapper.selectById(taskId);
        if (task == null || task.getStoryboardId() == null) {
            return;
        }

        CharacterProjectStoryboard storyboard = characterProjectStoryboardMapper.selectById(task.getStoryboardId());
        if (storyboard == null) {
            return;
        }

        if ("succeeded".equals(status)) {
            storyboard.setStatus(CharacterProjectStoryboard.Status.COMPLETED);
            storyboard.setVideoUrl(videoUrl);
        } else if ("failed".equals(status)) {
            storyboard.setStatus(CharacterProjectStoryboard.Status.FAILED);
            storyboard.setErrorMessage(errorMessage);
        } else if ("running".equals(status)) {
            storyboard.setStatus(CharacterProjectStoryboard.Status.GENERATING);
        }

        characterProjectStoryboardMapper.updateById(storyboard);
        log.info("同步分镜状态: storyboardId={}, status={}", storyboard.getId(), status);
    }
}
