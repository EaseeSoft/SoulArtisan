package com.jf.soulartisan.controller;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSON;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.common.dto.WorkflowProjectCreateRequest;
import com.jf.soulartisan.common.dto.WorkflowProjectQueryRequest;
import com.jf.soulartisan.common.dto.WorkflowProjectUpdateRequest;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.entity.Character;
import com.jf.soulartisan.entity.Script;
import com.jf.soulartisan.entity.VideoResource;
import com.jf.soulartisan.entity.WorkflowProject;
import com.jf.soulartisan.mapper.CharacterMapper;
import com.jf.soulartisan.mapper.ScriptMapper;
import com.jf.soulartisan.mapper.VideoResourceMapper;
import com.jf.soulartisan.mapper.WorkflowProjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * 工作流项目管理接口
 */
@Slf4j
@RestController
@RequestMapping("/workflow/project")
@Tag(name = "工作流项目管理")
@SaUserCheckLogin
public class WorkflowProjectController {

    @Resource
    private WorkflowProjectMapper workflowProjectMapper;

    @Resource
    private ScriptMapper scriptMapper;

    @Resource
    private CharacterMapper characterMapper;

    @Resource
    private VideoResourceMapper videoResourceMapper;

    /**
     * 创建项目
     */
    @PostMapping
    @Operation(summary = "创建工作流项目")
    public Result<?> createProject(@Valid @RequestBody WorkflowProjectCreateRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            WorkflowProject project = new WorkflowProject();
            project.setUserId(userId);
            project.setName(request.getName());
            project.setDescription(request.getDescription());
            project.setThumbnail(request.getThumbnail());
            project.setScriptId(request.getScriptId());
            project.setWorkflowType(request.getWorkflowType());

            // 解析工作流数据
            WorkflowProject.WorkflowData workflowData = JSON.parseObject(
                    JSON.toJSONString(request.getWorkflowData()),
                    WorkflowProject.WorkflowData.class
            );
            project.setWorkflowData(workflowData);

            // 统计节点数量
            if (workflowData.getNodes() != null) {
                try {
                    int nodeCount = JSON.parseArray(JSON.toJSONString(workflowData.getNodes())).size();
                    project.setNodeCount(nodeCount);
                } catch (Exception e) {
                    project.setNodeCount(0);
                }
            } else {
                project.setNodeCount(0);
            }

            project.setLastOpenedAt(LocalDateTime.now());

            int result = workflowProjectMapper.insert(project);
            if (result <= 0) {
                log.error("创建项目失败: user_id={}", userId);
                return Result.error("创建项目失败", 500);
            }

            log.info("项目创建成功: id={}, name={}, user_id={}", project.getId(), project.getName(), userId);

            Map<String, Object> data = new HashMap<>();
            data.put("id", project.getId());
            data.put("name", project.getName());
            data.put("createdAt", project.getCreatedAt());

            return Result.success(data, "项目创建成功");

        } catch (Exception e) {
            log.error("创建项目失败: {}", e.getMessage(), e);
            return Result.error("创建项目失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取项目详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取项目详情")
    public Result<?> getProject(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            WorkflowProject project = workflowProjectMapper.selectById(id);

            if (project == null) {
                return Result.error("项目不存在", 404);
            }

            if (!project.getUserId().equals(userId)) {
                return Result.error("无权访问此项目", 403);
            }

            // 更新最后打开时间
            project.setLastOpenedAt(LocalDateTime.now());
            workflowProjectMapper.updateById(project);

            Map<String, Object> data = new HashMap<>();
            data.put("id", project.getId());
            data.put("name", project.getName());
            data.put("description", project.getDescription());
            data.put("thumbnail", project.getThumbnail());
            data.put("scriptId", project.getScriptId());
            // 如果有剧本，查询剧本名称
            if (project.getScriptId() != null) {
                Script script = scriptMapper.selectById(project.getScriptId());
                if (script != null) {
                    data.put("scriptName", script.getName());
                }
            }
            data.put("workflowType", project.getWorkflowType());
            data.put("workflowData", project.getWorkflowData());
            data.put("nodeCount", project.getNodeCount());
            data.put("lastOpenedAt", project.getLastOpenedAt());
            data.put("createdAt", project.getCreatedAt());
            data.put("updatedAt", project.getUpdatedAt());

            log.info("获取项目成功: id={}, user_id={}", id, userId);

            return Result.success(data);

        } catch (Exception e) {
            log.error("获取项目失败: {}", e.getMessage(), e);
            return Result.error("获取项目失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 更新项目
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新项目")
    public Result<?> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody WorkflowProjectUpdateRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            WorkflowProject project = workflowProjectMapper.selectById(id);

            if (project == null) {
                return Result.error("项目不存在", 404);
            }

            if (!project.getUserId().equals(userId)) {
                return Result.error("无权修改此项目", 403);
            }

            // 更新字段
            if (StrUtil.isNotBlank(request.getName())) {
                project.setName(request.getName());
            }

            if (request.getDescription() != null) {
                project.setDescription(request.getDescription());
            }

            if (request.getThumbnail() != null) {
                project.setThumbnail(request.getThumbnail());
            }

            // 更新工作流类型
            if (StrUtil.isNotBlank(request.getWorkflowType())) {
                project.setWorkflowType(request.getWorkflowType());
            }

            // 更新剧本绑定（可以传 null 解除绑定）
            if (request.getScriptId() != null) {
                Long newScriptId = request.getScriptId();
                Long oldScriptId = project.getScriptId();
                project.setScriptId(newScriptId);

                // 当绑定剧本时，同步更新该项目下所有角色/场景和资源的 scriptId
                if (newScriptId > 0 && !newScriptId.equals(oldScriptId)) {
                    // 同步更新角色/场景的剧本绑定
                    LambdaQueryWrapper<Character> characterQuery = new LambdaQueryWrapper<>();
                    characterQuery.eq(Character::getWorkflowProjectId, id);

                    Character updateCharacter = new Character();
                    updateCharacter.setScriptId(newScriptId);

                    int characterCount = characterMapper.update(updateCharacter, characterQuery);
                    log.info("同步更新角色/场景的剧本绑定: projectId={}, scriptId={}, count={}",
                            id, newScriptId, characterCount);

                    // 同步更新视频资源的剧本绑定
                    LambdaQueryWrapper<VideoResource> resourceQuery = new LambdaQueryWrapper<>();
                    resourceQuery.eq(VideoResource::getWorkflowProjectId, id);

                    VideoResource updateResource = new VideoResource();
                    updateResource.setScriptId(newScriptId);

                    int resourceCount = videoResourceMapper.update(updateResource, resourceQuery);
                    log.info("同步更新视频资源的剧本绑定: projectId={}, scriptId={}, count={}",
                            id, newScriptId, resourceCount);
                }
            }

            if (request.getWorkflowData() != null) {
                WorkflowProject.WorkflowData workflowData = JSON.parseObject(
                        JSON.toJSONString(request.getWorkflowData()),
                        WorkflowProject.WorkflowData.class
                );
                project.setWorkflowData(workflowData);

                // 更新节点数量
                if (workflowData.getNodes() != null) {
                    try {
                        int nodeCount = JSON.parseArray(JSON.toJSONString(workflowData.getNodes())).size();
                        project.setNodeCount(nodeCount);
                    } catch (Exception e) {
                        project.setNodeCount(0);
                    }
                }
            }

            int result = workflowProjectMapper.updateById(project);
            if (result <= 0) {
                log.error("更新项目失败: id={}", id);
                return Result.error("更新项目失败", 500);
            }

            log.info("项目更新成功: id={}, name={}, user_id={}", project.getId(), project.getName(), userId);

            return Result.success(null, "项目更新成功");

        } catch (Exception e) {
            log.error("更新项目失败: {}", e.getMessage(), e);
            return Result.error("更新项目失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 删除项目
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除项目")
    public Result<?> deleteProject(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            WorkflowProject project = workflowProjectMapper.selectById(id);

            if (project == null) {
                return Result.error("项目不存在", 404);
            }

            if (!project.getUserId().equals(userId)) {
                return Result.error("无权删除此项目", 403);
            }

            workflowProjectMapper.deleteById(id);

            log.info("项目删除成功: id={}, name={}, user_id={}", id, project.getName(), userId);

            return Result.success(null, "项目删除成功");

        } catch (Exception e) {
            log.error("删除项目失败: {}", e.getMessage(), e);
            return Result.error("删除项目失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取项目列表
     */
    @GetMapping("/list")
    @Operation(summary = "获取项目列表")
    public Result<?> getProjectList(@Valid WorkflowProjectQueryRequest request) {
        request.validateAndCorrect();

        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            LambdaQueryWrapper<WorkflowProject> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(WorkflowProject::getUserId, userId);

            // 关键词搜索
            if (StrUtil.isNotBlank(request.getKeyword())) {
                queryWrapper.and(wrapper ->
                        wrapper.like(WorkflowProject::getName, request.getKeyword())
                                .or()
                                .like(WorkflowProject::getDescription, request.getKeyword())
                );
            }

            // 按剧本ID筛选
            if (request.getScriptId() != null) {
                queryWrapper.eq(WorkflowProject::getScriptId, request.getScriptId());
            }

            // 按工作流类型筛选
            if (StrUtil.isNotBlank(request.getWorkflowType())) {
                queryWrapper.eq(WorkflowProject::getWorkflowType, request.getWorkflowType());
            }

            // 排序
            if ("createdAt".equals(request.getSortBy())) {
                queryWrapper.orderBy(true, "asc".equals(request.getSortOrder()),
                        WorkflowProject::getCreatedAt);
            } else if ("lastOpenedAt".equals(request.getSortBy())) {
                queryWrapper.orderBy(true, "asc".equals(request.getSortOrder()),
                        WorkflowProject::getLastOpenedAt);
            } else {
                queryWrapper.orderBy(true, "asc".equals(request.getSortOrder()),
                        WorkflowProject::getUpdatedAt);
            }

            // 不返回完整的 workflowData（列表查询时不需要）
            queryWrapper.select(
                    WorkflowProject::getId,
                    WorkflowProject::getName,
                    WorkflowProject::getDescription,
                    WorkflowProject::getThumbnail,
                    WorkflowProject::getScriptId,
                    WorkflowProject::getWorkflowType,
                    WorkflowProject::getNodeCount,
                    WorkflowProject::getLastOpenedAt,
                    WorkflowProject::getCreatedAt,
                    WorkflowProject::getUpdatedAt
            );

            Page<WorkflowProject> pageParam = new Page<>(request.getPage(), request.getPageSize());
            IPage<WorkflowProject> pageResult = workflowProjectMapper.selectPage(pageParam, queryWrapper);

            // 为每个项目查询剧本名称
            Map<String, Object> resultData = new HashMap<>();
            resultData.put("list", pageResult.getRecords().stream().map(project -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", project.getId());
                item.put("name", project.getName());
                item.put("description", project.getDescription());
                item.put("thumbnail", project.getThumbnail());
                item.put("scriptId", project.getScriptId());
                // 如果有剧本，查询剧本名称
                if (project.getScriptId() != null) {
                    Script script = scriptMapper.selectById(project.getScriptId());
                    if (script != null) {
                        item.put("scriptName", script.getName());
                    }
                }
                item.put("workflowType", project.getWorkflowType());
                item.put("nodeCount", project.getNodeCount());
                item.put("lastOpenedAt", project.getLastOpenedAt());
                item.put("createdAt", project.getCreatedAt());
                item.put("updatedAt", project.getUpdatedAt());
                return item;
            }).toList());
            resultData.put("total", pageResult.getTotal());
            resultData.put("page", (int) pageResult.getCurrent());
            resultData.put("pageSize", (int) pageResult.getSize());

            log.info("获取项目列表成功: user_id={}, total={}", userId, pageResult.getTotal());

            return Result.success(resultData);

        } catch (Exception e) {
            log.error("获取项目列表失败: {}", e.getMessage(), e);
            return Result.error("获取项目列表失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 复制项目
     */
    @PostMapping("/{id}/duplicate")
    @Operation(summary = "复制项目")
    public Result<?> duplicateProject(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            WorkflowProject original = workflowProjectMapper.selectById(id);

            if (original == null) {
                return Result.error("项目不存在", 404);
            }

            if (!original.getUserId().equals(userId)) {
                return Result.error("无权复制此项目", 403);
            }

            // 创建副本
            WorkflowProject duplicate = new WorkflowProject();
            duplicate.setUserId(userId);
            duplicate.setName(original.getName() + " (副本)");
            duplicate.setDescription(original.getDescription());
            duplicate.setThumbnail(original.getThumbnail());
            duplicate.setWorkflowType(original.getWorkflowType());
            duplicate.setWorkflowData(original.getWorkflowData());
            duplicate.setNodeCount(original.getNodeCount());
            duplicate.setLastOpenedAt(LocalDateTime.now());

            int result = workflowProjectMapper.insert(duplicate);
            if (result <= 0) {
                log.error("复制项目失败: id={}", id);
                return Result.error("复制项目失败", 500);
            }

            log.info("项目复制成功: original_id={}, new_id={}, user_id={}", id, duplicate.getId(), userId);

            Map<String, Object> data = new HashMap<>();
            data.put("id", duplicate.getId());
            data.put("name", duplicate.getName());

            return Result.success(data, "项目复制成功");

        } catch (Exception e) {
            log.error("复制项目失败: {}", e.getMessage(), e);
            return Result.error("复制项目失败: " + e.getMessage(), 500);
        }
    }
}
