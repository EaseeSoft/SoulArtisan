package com.jf.soulartisan.controller;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.common.dto.*;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.entity.Character;
import com.jf.soulartisan.entity.Script;
import com.jf.soulartisan.entity.ScriptMember;
import com.jf.soulartisan.entity.WorkflowProject;
import com.jf.soulartisan.mapper.CharacterMapper;
import com.jf.soulartisan.mapper.ScriptMapper;
import com.jf.soulartisan.mapper.ScriptMemberMapper;
import com.jf.soulartisan.mapper.WorkflowProjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 剧本管理接口
 */
@Slf4j
@RestController
@RequestMapping("/script")
@Tag(name = "剧本管理")
@SaUserCheckLogin
public class ScriptController {

    @Resource
    private ScriptMapper scriptMapper;

    @Resource
    private ScriptMemberMapper scriptMemberMapper;

    @Resource
    private CharacterMapper characterMapper;

    @Resource
    private WorkflowProjectMapper workflowProjectMapper;

    /**
     * 创建剧本
     */
    @PostMapping
    @Operation(summary = "创建剧本")
    public Result<?> createScript(@Valid @RequestBody ScriptCreateRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getAppLoginUserSiteId();

        try {
            Script script = new Script();
            script.setUserId(userId);
            script.setSiteId(siteId != null ? siteId : 1L);
            script.setName(request.getName());
            script.setDescription(request.getDescription());
            script.setCoverImage(request.getCoverImage());
            script.setStyle(request.getStyle());
            script.setStatus(Script.Status.ACTIVE);

            int result = scriptMapper.insert(script);
            if (result <= 0) {
                log.error("创建剧本失败: user_id={}", userId);
                return Result.error("创建剧本失败", 500);
            }

            // 自动添加创建者为成员
            ScriptMember member = new ScriptMember();
            member.setScriptId(script.getId());
            member.setUserId(userId);
            member.setRole(ScriptMember.Role.CREATOR);
            scriptMemberMapper.insert(member);

            log.info("剧本创建成功: id={}, name={}, user_id={}", script.getId(), script.getName(), userId);

            Map<String, Object> data = new HashMap<>();
            data.put("id", script.getId());
            data.put("name", script.getName());
            data.put("createdAt", script.getCreatedAt());

            return Result.success(data, "剧本创建成功");

        } catch (Exception e) {
            log.error("创建剧本失败: {}", e.getMessage(), e);
            return Result.error("创建剧本失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取剧本详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取剧本详情")
    public Result<?> getScript(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Script script = scriptMapper.selectById(id);

            if (script == null) {
                return Result.error("剧本不存在", 404);
            }

            // 检查用户角色（创建者或成员）
            String userRole = scriptMemberMapper.selectRoleByScriptIdAndUserId(id, userId);
            if (userRole == null) {
                return Result.error("无权访问此剧本", 403);
            }

            // 统计资源和项目数量
            Long pictureResourceCount = scriptMapper.countPictureResourcesByScriptId(id);
            Long videoResourceCount = scriptMapper.countVideoResourcesByScriptId(id);
            Long projectCount = scriptMapper.countProjectsByScriptId(id);

            Map<String, Object> data = new HashMap<>();
            data.put("id", script.getId());
            data.put("name", script.getName());
            data.put("description", script.getDescription());
            data.put("coverImage", script.getCoverImage());
            data.put("style", script.getStyle());
            data.put("status", script.getStatus());
            data.put("pictureResourceCount", pictureResourceCount);
            data.put("videoResourceCount", videoResourceCount);
            data.put("projectCount", projectCount);
            data.put("userRole", userRole); // 返回用户角色
            data.put("createdAt", script.getCreatedAt());
            data.put("updatedAt", script.getUpdatedAt());

            log.info("获取剧本成功: id={}, user_id={}, role={}", id, userId, userRole);

            return Result.success(data);

        } catch (Exception e) {
            log.error("获取剧本失败: {}", e.getMessage(), e);
            return Result.error("获取剧本失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 更新剧本
     */
    @PutMapping("/{id}")
    @Operation(summary = "更新剧本")
    public Result<?> updateScript(
            @PathVariable Long id,
            @Valid @RequestBody ScriptUpdateRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Script script = scriptMapper.selectById(id);

            if (script == null) {
                return Result.error("剧本不存在", 404);
            }

            // 只有创建者可以修改
            String userRole = scriptMemberMapper.selectRoleByScriptIdAndUserId(id, userId);
            if (!ScriptMember.Role.CREATOR.equals(userRole)) {
                return Result.error("无权修改此剧本", 403);
            }

            // 更新字段
            if (StrUtil.isNotBlank(request.getName())) {
                script.setName(request.getName());
            }

            if (request.getDescription() != null) {
                script.setDescription(request.getDescription());
            }

            if (request.getCoverImage() != null) {
                script.setCoverImage(request.getCoverImage());
            }

            if (StrUtil.isNotBlank(request.getStatus())) {
                script.setStatus(request.getStatus());
            }

            if (request.getStyle() != null) {
                script.setStyle(request.getStyle());
            }

            int result = scriptMapper.updateById(script);
            if (result <= 0) {
                log.error("更新剧本失败: id={}", id);
                return Result.error("更新剧本失败", 500);
            }

            log.info("剧本更新成功: id={}, name={}, user_id={}", script.getId(), script.getName(), userId);

            return Result.success(null, "剧本更新成功");

        } catch (Exception e) {
            log.error("更新剧本失败: {}", e.getMessage(), e);
            return Result.error("更新剧本失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 删除剧本
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除剧本")
    public Result<?> deleteScript(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Script script = scriptMapper.selectById(id);

            if (script == null) {
                return Result.error("剧本不存在", 404);
            }

            // 只有创建者可以删除
            String userRole = scriptMemberMapper.selectRoleByScriptIdAndUserId(id, userId);
            if (!ScriptMember.Role.CREATOR.equals(userRole)) {
                return Result.error("无权删除此剧本", 403);
            }

            // 检查是否有关联项目
            Long projectCount = scriptMapper.countProjectsByScriptId(id);
            if (projectCount > 0) {
                return Result.error("该剧本下有 " + projectCount + " 个关联项目，请先解除关联", 400);
            }

            // 删除剧本下的所有角色
            LambdaQueryWrapper<Character> charWrapper = new LambdaQueryWrapper<>();
            charWrapper.eq(Character::getScriptId, id);
            characterMapper.delete(charWrapper);

            // 删除剧本成员记录
            LambdaQueryWrapper<ScriptMember> memberWrapper = new LambdaQueryWrapper<>();
            memberWrapper.eq(ScriptMember::getScriptId, id);
            scriptMemberMapper.delete(memberWrapper);

            // 删除剧本
            scriptMapper.deleteById(id);

            log.info("剧本删除成功: id={}, name={}, user_id={}", id, script.getName(), userId);

            return Result.success(null, "剧本删除成功");

        } catch (Exception e) {
            log.error("删除剧本失败: {}", e.getMessage(), e);
            return Result.error("删除剧本失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取剧本列表
     */
    @GetMapping("/list")
    @Operation(summary = "获取剧本列表")
    public Result<?> getScriptList(@Valid ScriptQueryRequest request) {
        request.validateAndCorrect();

        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            // 查询用户参与的所有剧本ID和角色
            List<Map<String, Object>> memberRecords = scriptMemberMapper.selectMembersWithUserInfo(null);
            LambdaQueryWrapper<ScriptMember> memberQuery = new LambdaQueryWrapper<>();
            memberQuery.eq(ScriptMember::getUserId, userId);
            List<ScriptMember> userMembers = scriptMemberMapper.selectList(memberQuery);

            if (userMembers.isEmpty()) {
                // 没有任何剧本
                return Result.success(PageResult.of(new ArrayList<>(), 0L,
                        request.getPage(), request.getPageSize()));
            }

            // 构建剧本ID到角色的映射
            Map<Long, String> scriptRoleMap = new HashMap<>();
            List<Long> scriptIds = new ArrayList<>();
            for (ScriptMember member : userMembers) {
                scriptIds.add(member.getScriptId());
                scriptRoleMap.put(member.getScriptId(), member.getRole());
            }

            LambdaQueryWrapper<Script> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.in(Script::getId, scriptIds);

            // 关键词搜索
            if (StrUtil.isNotBlank(request.getKeyword())) {
                queryWrapper.and(wrapper ->
                        wrapper.like(Script::getName, request.getKeyword())
                                .or()
                                .like(Script::getDescription, request.getKeyword())
                );
            }

            // 状态筛选
            if (StrUtil.isNotBlank(request.getStatus())) {
                queryWrapper.eq(Script::getStatus, request.getStatus());
            }

            // 排序
            if ("createdAt".equals(request.getSortBy())) {
                queryWrapper.orderBy(true, "asc".equals(request.getSortOrder()),
                        Script::getCreatedAt);
            } else {
                queryWrapper.orderBy(true, "asc".equals(request.getSortOrder()),
                        Script::getUpdatedAt);
            }

            Page<Script> pageParam = new Page<>(request.getPage(), request.getPageSize());
            IPage<Script> pageResult = scriptMapper.selectPage(pageParam, queryWrapper);

            // 为每个剧本添加统计信息和用户角色
            List<Map<String, Object>> list = pageResult.getRecords().stream().map(script -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", script.getId());
                item.put("name", script.getName());
                item.put("description", script.getDescription());
                item.put("coverImage", script.getCoverImage());
                item.put("style", script.getStyle());
                item.put("status", script.getStatus());
                item.put("pictureResourceCount", scriptMapper.countPictureResourcesByScriptId(script.getId()));
                item.put("videoResourceCount", scriptMapper.countVideoResourcesByScriptId(script.getId()));
                item.put("projectCount", scriptMapper.countProjectsByScriptId(script.getId()));
                item.put("userRole", scriptRoleMap.get(script.getId())); // 用户在剧本中的角色
                item.put("createdAt", script.getCreatedAt());
                item.put("updatedAt", script.getUpdatedAt());
                return item;
            }).toList();

            log.info("获取剧本列表成功: user_id={}, total={}", userId, pageResult.getTotal());

            return Result.success(PageResult.of(list, pageResult.getTotal(),
                    (int) pageResult.getCurrent(), (int) pageResult.getSize()));

        } catch (Exception e) {
            log.error("获取剧本列表失败: {}", e.getMessage(), e);
            return Result.error("获取剧本列表失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取剧本的角色列表
     */
    @GetMapping("/{id}/characters")
    @Operation(summary = "获取剧本角色列表")
    public Result<?> getScriptCharacters(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Script script = scriptMapper.selectById(id);

            if (script == null) {
                return Result.error("剧本不存在", 404);
            }

            // 检查用户是否有权限访问（创建者或成员）
            if (!scriptMemberMapper.existsByScriptIdAndUserId(id, userId)) {
                return Result.error("无权访问此剧本", 403);
            }

            LambdaQueryWrapper<Character> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(Character::getScriptId, id)
                    .orderByDesc(Character::getCreatedAt);

            List<Character> characters = characterMapper.selectList(queryWrapper);

            Map<String, Object> data = new HashMap<>();
            data.put("scriptId", id);
            data.put("scriptName", script.getName());
            data.put("characters", characters);
            data.put("total", characters.size());

            log.info("获取剧本角色列表成功: script_id={}, total={}", id, characters.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("获取剧本角色列表失败: {}", e.getMessage(), e);
            return Result.error("获取剧本角色列表失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取剧本关联的项目列表
     */
    @GetMapping("/{id}/projects")
    @Operation(summary = "获取剧本关联的项目列表")
    public Result<?> getScriptProjects(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Script script = scriptMapper.selectById(id);

            if (script == null) {
                return Result.error("剧本不存在", 404);
            }

            // 检查用户是否有权限访问（创建者或成员）
            String userRole = scriptMemberMapper.selectRoleByScriptIdAndUserId(id, userId);
            if (userRole == null) {
                return Result.error("无权访问此剧本", 403);
            }

            LambdaQueryWrapper<WorkflowProject> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(WorkflowProject::getScriptId, id);

            // 如果是成员，只能看到自己创建的项目
            if (ScriptMember.Role.MEMBER.equals(userRole)) {
                queryWrapper.eq(WorkflowProject::getUserId, userId);
            }

            queryWrapper.select(WorkflowProject::getId, WorkflowProject::getName,
                            WorkflowProject::getDescription, WorkflowProject::getThumbnail,
                            WorkflowProject::getNodeCount, WorkflowProject::getUpdatedAt)
                    .orderByDesc(WorkflowProject::getUpdatedAt);

            List<WorkflowProject> projects = workflowProjectMapper.selectList(queryWrapper);

            Map<String, Object> data = new HashMap<>();
            data.put("scriptId", id);
            data.put("scriptName", script.getName());
            data.put("projects", projects);
            data.put("total", projects.size());

            log.info("获取剧本关联项目列表成功: script_id={}, user_role={}, total={}", id, userRole, projects.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("获取剧本关联项目列表失败: {}", e.getMessage(), e);
            return Result.error("获取剧本关联项目列表失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取简单的剧本列表（用于下拉选择）
     */
    @GetMapping("/simple-list")
    @Operation(summary = "获取简单剧本列表")
    public Result<?> getSimpleScriptList() {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            // 查询用户参与的所有剧本ID
            LambdaQueryWrapper<ScriptMember> memberQuery = new LambdaQueryWrapper<>();
            memberQuery.eq(ScriptMember::getUserId, userId);
            List<ScriptMember> userMembers = scriptMemberMapper.selectList(memberQuery);

            if (userMembers.isEmpty()) {
                return Result.success(new ArrayList<>());
            }

            // 构建剧本ID到角色的映射
            Map<Long, String> scriptRoleMap = new HashMap<>();
            List<Long> scriptIds = new ArrayList<>();
            for (ScriptMember member : userMembers) {
                scriptIds.add(member.getScriptId());
                scriptRoleMap.put(member.getScriptId(), member.getRole());
            }

            LambdaQueryWrapper<Script> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.in(Script::getId, scriptIds)
                    .eq(Script::getStatus, Script.Status.ACTIVE)
                    .select(Script::getId, Script::getName, Script::getStyle)
                    .orderByDesc(Script::getUpdatedAt);

            List<Script> scripts = scriptMapper.selectList(queryWrapper);

            List<Map<String, Object>> list = scripts.stream().map(script -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", script.getId());
                item.put("name", script.getName());
                item.put("style", script.getStyle());
                item.put("userRole", scriptRoleMap.get(script.getId()));
                return item;
            }).toList();

            return Result.success(list);

        } catch (Exception e) {
            log.error("获取简单剧本列表失败: {}", e.getMessage(), e);
            return Result.error("获取简单剧本列表失败: " + e.getMessage(), 500);
        }
    }

    // ==================== 成员管理相关 API ====================

    /**
     * 获取剧本成员列表
     */
    @GetMapping("/{id}/members")
    @Operation(summary = "获取剧本成员列表")
    public Result<?> getScriptMembers(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Script script = scriptMapper.selectById(id);

            if (script == null) {
                return Result.error("剧本不存在", 404);
            }

            // 只有创建者可以查看成员列表
            String userRole = scriptMemberMapper.selectRoleByScriptIdAndUserId(id, userId);
            if (!ScriptMember.Role.CREATOR.equals(userRole)) {
                return Result.error("无权查看成员列表", 403);
            }

            List<Map<String, Object>> members = scriptMemberMapper.selectMembersWithUserInfo(id);

            Map<String, Object> data = new HashMap<>();
            data.put("scriptId", id);
            data.put("members", members);
            data.put("total", members.size());

            log.info("获取剧本成员列表成功: script_id={}, total={}", id, members.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("获取剧本成员列表失败: {}", e.getMessage(), e);
            return Result.error("获取剧本成员列表失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 批量添加剧本成员
     */
    @PostMapping("/{id}/members")
    @Operation(summary = "批量添加剧本成员")
    public Result<?> addScriptMembers(
            @PathVariable Long id,
            @Valid @RequestBody ScriptMemberAddRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getAppLoginUserSiteId();

        try {
            Script script = scriptMapper.selectById(id);

            if (script == null) {
                return Result.error("剧本不存在", 404);
            }

            // 只有创建者可以添加成员
            String userRole = scriptMemberMapper.selectRoleByScriptIdAndUserId(id, userId);
            if (!ScriptMember.Role.CREATOR.equals(userRole)) {
                return Result.error("无权添加成员", 403);
            }

            int addedCount = 0;
            int skippedCount = 0;

            for (Long targetUserId : request.getUserIds()) {
                // 检查是否已经是成员
                if (scriptMemberMapper.existsByScriptIdAndUserId(id, targetUserId)) {
                    skippedCount++;
                    continue;
                }

                // 添加成员
                ScriptMember member = new ScriptMember();
                member.setScriptId(id);
                member.setUserId(targetUserId);
                member.setRole(ScriptMember.Role.MEMBER);
                scriptMemberMapper.insert(member);
                addedCount++;
            }

            Map<String, Object> data = new HashMap<>();
            data.put("addedCount", addedCount);
            data.put("skippedCount", skippedCount);

            log.info("批量添加剧本成员成功: script_id={}, added={}, skipped={}", id, addedCount, skippedCount);

            return Result.success(data, "添加成功");

        } catch (Exception e) {
            log.error("添加剧本成员失败: {}", e.getMessage(), e);
            return Result.error("添加剧本成员失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 移除剧本成员
     */
    @DeleteMapping("/{id}/members/{memberId}")
    @Operation(summary = "移除剧本成员")
    public Result<?> removeScriptMember(
            @PathVariable Long id,
            @PathVariable Long memberId
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Script script = scriptMapper.selectById(id);

            if (script == null) {
                return Result.error("剧本不存在", 404);
            }

            // 只有创建者可以移除成员
            String userRole = scriptMemberMapper.selectRoleByScriptIdAndUserId(id, userId);
            if (!ScriptMember.Role.CREATOR.equals(userRole)) {
                return Result.error("无权移除成员", 403);
            }

            // 不能移除创建者
            String targetRole = scriptMemberMapper.selectRoleByScriptIdAndUserId(id, memberId);
            if (ScriptMember.Role.CREATOR.equals(targetRole)) {
                return Result.error("不能移除创建者", 400);
            }

            // 删除成员记录
            LambdaQueryWrapper<ScriptMember> deleteWrapper = new LambdaQueryWrapper<>();
            deleteWrapper.eq(ScriptMember::getScriptId, id)
                    .eq(ScriptMember::getUserId, memberId);
            int deleted = scriptMemberMapper.delete(deleteWrapper);

            if (deleted <= 0) {
                return Result.error("该用户不是成员", 404);
            }

            log.info("移除剧本成员成功: script_id={}, member_user_id={}", id, memberId);

            return Result.success(null, "移除成功");

        } catch (Exception e) {
            log.error("移除剧本成员失败: {}", e.getMessage(), e);
            return Result.error("移除剧本成员失败: " + e.getMessage(), 500);
        }
    }
}
