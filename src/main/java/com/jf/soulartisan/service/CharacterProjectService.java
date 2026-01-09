package com.jf.soulartisan.service;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.jf.soulartisan.dto.characterproject.*;
import com.jf.soulartisan.entity.CharacterProject;
import com.jf.soulartisan.entity.CharacterProjectStoryboard;
import com.jf.soulartisan.entity.VideoResource;

import java.util.List;
import java.util.Map;

/**
 * 角色项目服务接口
 */
public interface CharacterProjectService extends IService<CharacterProject> {

    // ==================== 项目管理 ====================

    /**
     * 创建角色项目
     */
    CharacterProject createProject(Long userId, Long siteId, CreateCharacterProjectRequest request);

    /**
     * 获取项目详情
     */
    CharacterProject getProjectById(Long projectId, Long userId);

    /**
     * 分页查询用户项目列表
     */
    Page<CharacterProject> listProjects(Long userId, Integer page, Integer pageSize);

    /**
     * 更新项目
     */
    CharacterProject updateProject(Long projectId, Long userId, UpdateCharacterProjectRequest request);

    /**
     * 删除项目
     */
    void deleteProject(Long projectId, Long userId);

    // ==================== 步骤1：输入剧本 ====================

    /**
     * 保存剧本内容和风格
     */
    CharacterProject saveScript(Long projectId, Long userId, SaveScriptRequest request);

    // ==================== 步骤2：资源管理 ====================

    /**
     * 批量创建资源（提取创建）
     */
    List<VideoResource> batchCreateResources(Long projectId, Long userId, Long siteId, BatchCreateResourceRequest request);

    /**
     * 绑定已有资源（从剧本选择）
     */
    void bindResources(Long projectId, Long userId, BindResourcesRequest request);

    /**
     * 解绑资源
     */
    void unbindResource(Long projectId, Long userId, Long resourceId);

    /**
     * 获取项目资源列表（含来源信息）
     */
    List<Map<String, Object>> getProjectResources(Long projectId, Long userId);

    /**
     * 获取可选资源列表（从指定剧本）
     */
    Map<String, Object> getAvailableResources(Long projectId, Long userId, Long scriptId);

    /**
     * 生成资源视频
     */
    VideoResource generateResourceVideo(Long projectId, Long userId, Long resourceId, GenerateResourceRequest request);

    /**
     * 删除资源
     */
    void deleteResource(Long projectId, Long userId, Long resourceId);

    // ==================== 步骤3：分镜管理 ====================

    /**
     * 批量创建分镜
     */
    List<CharacterProjectStoryboard> batchCreateStoryboards(Long projectId, Long userId, Long siteId, BatchCreateStoryboardRequest request);

    /**
     * 获取项目分镜列表（含资源信息）
     */
    List<Map<String, Object>> getProjectStoryboards(Long projectId, Long userId);

    /**
     * 绑定分镜资源
     */
    void bindStoryboardResources(Long projectId, Long userId, Long storyboardId, BindStoryboardResourcesRequest request);

    /**
     * 解绑分镜资源
     */
    void unbindStoryboardResource(Long projectId, Long userId, Long storyboardId, Long resourceId);

    /**
     * 生成分镜视频
     */
    CharacterProjectStoryboard generateStoryboardVideo(Long projectId, Long userId, Long storyboardId);

    /**
     * 批量生成分镜视频
     */
    List<CharacterProjectStoryboard> batchGenerateStoryboardVideos(Long projectId, Long userId, BatchGenerateStoryboardsRequest request);

    /**
     * 更新分镜
     */
    CharacterProjectStoryboard updateStoryboard(Long projectId, Long userId, Long storyboardId, UpdateStoryboardRequest request);

    /**
     * 删除分镜
     */
    void deleteStoryboard(Long projectId, Long userId, Long storyboardId);

    /**
     * 同步分镜状态（任务回调）
     */
    void syncStoryboardStatus(Long taskId, String status, String videoUrl, String errorMessage);
}
