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
import com.jf.soulartisan.entity.Character;
import com.jf.soulartisan.entity.Script;
import com.jf.soulartisan.entity.VideoGenerationTask;
import com.jf.soulartisan.entity.WorkflowProject;
import com.jf.soulartisan.mapper.CharacterMapper;
import com.jf.soulartisan.mapper.ScriptMapper;
import com.jf.soulartisan.mapper.VideoGenerationTaskMapper;
import com.jf.soulartisan.mapper.WorkflowProjectMapper;
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

@Slf4j
@RestController
@RequestMapping("/character")
@Tag(name = "角色生成接口")
@SaUserCheckLogin
public class CharacterController {

    @Resource
    private CharacterService characterService;

    @Resource
    private CharacterMapper characterMapper;

    @Resource
    private ScriptMapper scriptMapper;

    @Resource
    private WorkflowProjectMapper workflowProjectMapper;

    @Resource
    private VideoGenerationTaskMapper videoGenerationTaskMapper;

    @Resource
    private CosService cosService;

    @PostMapping("/create")
    @Operation(summary = "创建角色生成任务")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> createCharacter(@Valid @RequestBody CharacterGenerationRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        try {
            // 验证请求参数
            request.validate();

            // 验证项目是否存在且属于当前用户
            WorkflowProject project = workflowProjectMapper.selectById(request.getProjectId());
            if (project == null) {
                return Result.error("项目不存在", 404);
            }
            if (!project.getUserId().equals(userId)) {
                return Result.error("无权操作此项目", 403);
            }

            // 调用角色生成API（回调URL从站点配置读取）
            JSONObject response = characterService.createCharacterTask(
                    siteId,
                    request.getUrl(),
                    request.getFromTask(),
                    request.getTimestamps()
            );

            if (response == null) {
                return Result.error("调用角色生成服务失败", 500);
            }

            String characterId = characterService.extractCharacterId(response);
            if (StrUtil.isBlank(characterId)) {
                log.error("获取角色ID失败，响应: {}", response.toJSONString());
                return Result.error("获取角色ID失败", 500);
            }

            // 解析时间戳
            String[] parts = request.getTimestamps().split(",");
            BigDecimal startTime = new BigDecimal(parts[0].trim());
            BigDecimal endTime = new BigDecimal(parts[1].trim());

            // 保存角色到数据库
            Character character = new Character();
            character.setUserId(userId);
            character.setSiteId(siteId);
            character.setWorkflowProjectId(request.getProjectId());
            // 如果项目绑定了剧本，角色也关联到剧本
            Long scriptId = null;
            if (project.getScriptId() != null) {
                scriptId = project.getScriptId();
                character.setScriptId(scriptId);
            }

            // 处理角色名称：检查同名并自动添加随机字符
            String characterName = request.getCharacterName();
            if (StrUtil.isNotBlank(characterName)) {
                characterName = generateUniqueCharacterName(characterName.trim(), request.getProjectId(), scriptId, null);
            }
            character.setCharacterName(characterName);
            character.setGenerationTaskId(characterId);
            character.setVideoTaskId(request.getFromTask());
            if (StrUtil.isNotEmpty(request.getFromTask())) {
                VideoGenerationTask videoGenerationTask = videoGenerationTaskMapper.selectByTaskId(request.getFromTask());
                character.setCharacterVideoUrl(videoGenerationTask.getResultUrl());
                character.setVideoUrl(videoGenerationTask.getResultUrl());
            } else {
                character.setVideoUrl(request.getUrl());
                character.setCharacterVideoUrl(request.getUrl());
            }
            character.setTimestamps(request.getTimestamps());
            character.setStartTime(startTime);
            character.setEndTime(endTime);
            character.setStatus(Character.Status.PENDING);
            character.setIsRealPerson(StrUtil.isNotBlank(request.getFromTask()));

            try {
                String videoUrl = character.getVideoUrl();
                if (StrUtil.isNotBlank(videoUrl)) {
                    byte[] firstFrameBytes = VideoUtil.extractFirstFrame(videoUrl);
                    String imageUrl = cosService.uploadFile(siteId, firstFrameBytes, "character_" + System.currentTimeMillis() + ".jpg");
                    character.setCharacterImageUrl(imageUrl);
                    log.info("视频第一帧提取成功: {}", imageUrl);
                }
            } catch (Exception e) {
                log.error("提取视频第一帧失败: {}", e.getMessage(), e);
            }

            int result = characterMapper.insert(character);
            if (result <= 0) {
                log.error("保存角色失败: user_id={}", userId);
                return Result.error("保存角色失败", 500);
            }

            log.info("角色生成任务保存成功: id={}, character_id={}, project_id={}",
                    character.getId(), characterId, request.getProjectId());

            Map<String, Object> data = new HashMap<>();
            data.put("id", character.getId());
            data.put("characterName", character.getCharacterName());
            data.put("characterId", characterId);
            data.put("projectId", request.getProjectId());
            data.put("status", character.getStatus());
            data.put("isRealPerson", character.getIsRealPerson());
            data.put("createdAt", character.getCreatedAt());

            return Result.success(data, "角色任务创建成功");

        } catch (IllegalArgumentException e) {
            log.error("参数验证失败: {}", e.getMessage());
            return Result.error(e.getMessage(), 400);
        } catch (Exception e) {
            log.error("创建角色生成任务失败: {}", e.getMessage(), e);
            return Result.error("创建任务失败: " + e.getMessage(), 500);
        }
    }

    @GetMapping("/task/{id}")
    @Operation(summary = "查询角色生成任务状态")
    public Result<?> getCharacter(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Character character = characterMapper.selectById(id);

            if (character == null) {
                return Result.error("角色不存在", 404);
            }

            if (!character.getUserId().equals(userId)) {
                return Result.error("无权访问此角色", 403);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("id", character.getId());
            data.put("characterName", character.getCharacterName());
            data.put("characterId", character.getCharacterId());
            data.put("videoTaskId", character.getVideoTaskId());
            data.put("videoUrl", character.getVideoUrl());
            data.put("timestamps", character.getTimestamps());
            data.put("startTime", character.getStartTime());
            data.put("endTime", character.getEndTime());
            data.put("status", character.getStatus());
            data.put("resultData", character.getResultData());
            data.put("characterImageUrl", character.getCharacterImageUrl());
            data.put("characterVideoUrl", character.getCharacterVideoUrl());
            data.put("errorMessage", character.getErrorMessage());
            data.put("isRealPerson", character.getIsRealPerson());
            data.put("createdAt", character.getCreatedAt());
            data.put("updatedAt", character.getUpdatedAt());
            data.put("completedAt", character.getCompletedAt());

            return Result.success(data);

        } catch (Exception e) {
            log.error("查询角色失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    @GetMapping("/tasks")
    @Operation(summary = "获取角色生成任务列表")
    public Result<?> getCharacters(@Valid TaskQueryRequest request) {
        request.validateAndCorrect();

        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            LambdaQueryWrapper<Character> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(Character::getUserId, userId);

            if (StrUtil.isNotBlank(request.getStatus())) {
                queryWrapper.eq(Character::getStatus, request.getStatus());
            }

            queryWrapper.orderByDesc(Character::getCreatedAt);

            Page<Character> pageParam = new Page<>(request.getPage(), request.getPageSize());
            IPage<Character> pageResult = characterMapper.selectPage(pageParam, queryWrapper);

            return Result.success(PageResult.of(pageResult));

        } catch (Exception e) {
            log.error("查询角色列表失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "获取项目的角色列表")
    public Result<?> getProjectCharacters(@PathVariable Long projectId) {
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

            // 直接查询该项目的角色列表
            LambdaQueryWrapper<Character> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(Character::getWorkflowProjectId, projectId)
                    .eq(Character::getUserId, userId)
                    .orderByDesc(Character::getCreatedAt);

            var characters = characterMapper.selectList(queryWrapper);

            Map<String, Object> data = new HashMap<>();
            data.put("projectId", projectId);
            data.put("characters", characters);
            data.put("total", characters.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("查询项目角色列表失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    @PostMapping("/update/{id}")
    @Operation(summary = "更新角色信息")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> updateCharacter(@PathVariable Long id, @RequestBody Map<String, Object> updateData) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Character character = characterMapper.selectById(id);

            if (character == null) {
                return Result.error("角色不存在", 404);
            }

            if (!character.getUserId().equals(userId)) {
                return Result.error("无权修改此角色", 403);
            }

            // 更新角色名称
            if (updateData.containsKey("characterName")) {
                String characterName = (String) updateData.get("characterName");
                if (StrUtil.isBlank(characterName)) {
                    return Result.error("角色名称不能为空", 400);
                }

                String trimmedName = characterName.trim();

                // 如果名称发生变化，检查同名并自动添加随机字符
                if (!trimmedName.equals(character.getCharacterName())) {
                    trimmedName = generateUniqueCharacterName(
                            trimmedName,
                            character.getWorkflowProjectId(),
                            character.getScriptId(),
                            id
                    );
                }

                character.setCharacterName(trimmedName);
            }

            // 执行更新
            int result = characterMapper.updateById(character);
            if (result <= 0) {
                log.error("更新角色失败: id={}", id);
                return Result.error("更新失败", 500);
            }

            log.info("角色信息更新成功: id={}, characterName={}, projectId={}",
                    id, character.getCharacterName(), character.getWorkflowProjectId());

            // 返回更新后的角色信息
            Map<String, Object> data = new HashMap<>();
            data.put("id", character.getId());
            data.put("characterName", character.getCharacterName());
            data.put("characterId", character.getCharacterId());
            data.put("videoTaskId", character.getVideoTaskId());
            data.put("videoUrl", character.getVideoUrl());
            data.put("timestamps", character.getTimestamps());
            data.put("startTime", character.getStartTime());
            data.put("endTime", character.getEndTime());
            data.put("status", character.getStatus());
            data.put("resultData", character.getResultData());
            data.put("characterImageUrl", character.getCharacterImageUrl());
            data.put("characterVideoUrl", character.getCharacterVideoUrl());
            data.put("errorMessage", character.getErrorMessage());
            data.put("isRealPerson", character.getIsRealPerson());
            data.put("createdAt", character.getCreatedAt());
            data.put("updatedAt", character.getUpdatedAt());
            data.put("completedAt", character.getCompletedAt());

            return Result.success(data, "更新成功");

        } catch (Exception e) {
            log.error("更新角色失败: {}", e.getMessage(), e);
            return Result.error("更新失败: " + e.getMessage(), 500);
        }
    }

    @DeleteMapping("/task/{id}")
    @Operation(summary = "删除角色生成任务")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> deleteCharacter(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            Character character = characterMapper.selectById(id);

            if (character == null) {
                return Result.error("角色不存在", 404);
            }

            if (!character.getUserId().equals(userId)) {
                return Result.error("无权删除此角色", 403);
            }

            // 删除角色（级联删除会自动删除关联表数据）
            characterMapper.deleteById(id);

            return Result.success(null, "删除成功");

        } catch (Exception e) {
            log.error("删除角色失败: {}", e.getMessage(), e);
            return Result.error("删除失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 按剧本获取角色列表
     */
    @GetMapping("/script/{scriptId}")
    @Operation(summary = "获取剧本的角色列表")
    public Result<?> getScriptCharacters(@PathVariable Long scriptId) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            // 验证剧本权限
            Script script = scriptMapper.selectById(scriptId);
            if (script == null) {
                return Result.error("剧本不存在", 404);
            }
            if (!script.getUserId().equals(userId)) {
                return Result.error("无权访问此剧本", 403);
            }

            LambdaQueryWrapper<Character> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(Character::getScriptId, scriptId)
                    .orderByDesc(Character::getCreatedAt);

            var characters = characterMapper.selectList(queryWrapper);

            Map<String, Object> data = new HashMap<>();
            data.put("scriptId", scriptId);
            data.put("scriptName", script.getName());
            data.put("characters", characters);
            data.put("total", characters.size());

            return Result.success(data);

        } catch (Exception e) {
            log.error("查询剧本角色列表失败: {}", e.getMessage(), e);
            return Result.error("查询失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 复制角色到其他剧本
     */
    @PostMapping("/{id}/copy")
    @Operation(summary = "复制角色到其他剧本")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> copyCharacter(
            @PathVariable Long id,
            @Valid @RequestBody CharacterCopyRequest request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            // 验证源角色
            Character sourceCharacter = characterMapper.selectById(id);
            if (sourceCharacter == null) {
                return Result.error("角色不存在", 404);
            }
            if (!sourceCharacter.getUserId().equals(userId)) {
                return Result.error("无权复制此角色", 403);
            }

            // 验证目标剧本
            Script targetScript = scriptMapper.selectById(request.getTargetScriptId());
            if (targetScript == null) {
                return Result.error("目标剧本不存在", 404);
            }
            if (!targetScript.getUserId().equals(userId)) {
                return Result.error("无权访问目标剧本", 403);
            }

            // 确定新角色名称
            String newCharacterName = StrUtil.isNotBlank(request.getNewCharacterName())
                    ? request.getNewCharacterName().trim()
                    : sourceCharacter.getCharacterName();

            // 检查目标剧本中是否已存在同名角色
            LambdaQueryWrapper<Character> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(Character::getScriptId, request.getTargetScriptId())
                    .eq(Character::getCharacterName, newCharacterName);
            Long count = characterMapper.selectCount(queryWrapper);
            if (count > 0) {
                // 添加后缀避免重名
                newCharacterName = newCharacterName + " (副本)";
            }

            // 创建角色副本
            Character newCharacter = new Character();
            newCharacter.setUserId(userId);
            newCharacter.setSiteId(sourceCharacter.getSiteId());
            newCharacter.setScriptId(request.getTargetScriptId());
            newCharacter.setWorkflowProjectId(null); // 不关联到具体项目
            newCharacter.setCharacterName(newCharacterName);
            newCharacter.setCharacterId(sourceCharacter.getCharacterId());
            newCharacter.setGenerationTaskId(sourceCharacter.getGenerationTaskId());
            newCharacter.setVideoTaskId(sourceCharacter.getVideoTaskId());
            newCharacter.setVideoUrl(sourceCharacter.getVideoUrl());
            newCharacter.setTimestamps(sourceCharacter.getTimestamps());
            newCharacter.setStartTime(sourceCharacter.getStartTime());
            newCharacter.setEndTime(sourceCharacter.getEndTime());
            newCharacter.setStatus(sourceCharacter.getStatus());
            newCharacter.setResultData(sourceCharacter.getResultData());
            newCharacter.setCharacterImageUrl(sourceCharacter.getCharacterImageUrl());
            newCharacter.setCharacterVideoUrl(sourceCharacter.getCharacterVideoUrl());
            newCharacter.setIsRealPerson(sourceCharacter.getIsRealPerson());
            newCharacter.setCharacterType(sourceCharacter.getCharacterType());

            int result = characterMapper.insert(newCharacter);
            if (result <= 0) {
                log.error("复制角色失败: source_id={}", id);
                return Result.error("复制角色失败", 500);
            }

            log.info("角色复制成功: source_id={}, new_id={}, target_script_id={}",
                    id, newCharacter.getId(), request.getTargetScriptId());

            Map<String, Object> data = new HashMap<>();
            data.put("id", newCharacter.getId());
            data.put("characterName", newCharacter.getCharacterName());
            data.put("scriptId", newCharacter.getScriptId());
            data.put("scriptName", targetScript.getName());

            return Result.success(data, "角色复制成功");

        } catch (Exception e) {
            log.error("复制角色失败: {}", e.getMessage(), e);
            return Result.error("复制失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 生成随机英文字符后缀
     *
     * @param length 字符长度
     * @return 随机英文字符串
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
     * 生成唯一的角色名称（同一项目/剧本内不重名）
     *
     * @param baseName  基础名称
     * @param projectId 项目ID（可为null）
     * @param scriptId  剧本ID（可为null）
     * @param excludeId 排除的角色ID（更新时排除自己）
     * @return 唯一的角色名称
     */
    private String generateUniqueCharacterName(String baseName, Long projectId, Long scriptId, Long excludeId) {
        String candidateName = baseName;
        int maxAttempts = 10;

        for (int i = 0; i < maxAttempts; i++) {
            LambdaQueryWrapper<Character> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(Character::getCharacterName, candidateName);

            // 根据项目或剧本来判断唯一性
            if (scriptId != null) {
                queryWrapper.eq(Character::getScriptId, scriptId);
            } else if (projectId != null) {
                queryWrapper.eq(Character::getWorkflowProjectId, projectId);
            } else {
                // 没有项目和剧本，不需要检查唯一性
                return candidateName;
            }

            // 排除自己（更新场景）
            if (excludeId != null) {
                queryWrapper.ne(Character::getId, excludeId);
            }

            Long count = characterMapper.selectCount(queryWrapper);
            if (count == 0) {
                return candidateName;
            }

            // 存在同名，添加随机后缀
            candidateName = baseName + "_" + generateRandomSuffix(4);
        }

        // 极端情况下，添加时间戳确保唯一
        return baseName + "_" + System.currentTimeMillis();
    }

    /**
     * 批量创建资源
     */
    @PostMapping("/batch-create")
    @Operation(summary = "批量创建资源")
    @Transactional(rollbackFor = Exception.class)
    public Result<?> batchCreateAssets(@Valid @RequestBody BatchCreateAssetRequest request) {
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

            // 获取剧本ID（优先使用请求中的，否则使用项目关联的）
            Long scriptId = request.getScriptId();
            if (scriptId == null && project.getScriptId() != null) {
                scriptId = project.getScriptId();
            }

            List<Map<String, Object>> createdAssets = new ArrayList<>();
            int successCount = 0;
            int failCount = 0;

            for (BatchCreateAssetRequest.AssetItem item : request.getAssets()) {
                try {
                    // 生成唯一名称
                    String uniqueName = generateUniqueCharacterName(
                            item.getName().trim(),
                            request.getProjectId(),
                            scriptId,
                            null
                    );

                    // 创建资源实体
                    Character character = new Character();
                    character.setUserId(userId);
                    character.setSiteId(siteId);
                    character.setWorkflowProjectId(request.getProjectId());
                    character.setScriptId(scriptId);
                    character.setCharacterName(uniqueName);
                    character.setCharacterType(item.getType());
                    character.setPrompt(item.getPrompt());
                    character.setCharacterImageUrl(item.getImageUrl());
                    character.setIsRealPerson(false);

                    // 根据图片是否存在设置状态
                    if (StrUtil.isBlank(item.getImageUrl())) {
                        character.setStatus(Character.Status.NOT_GENERATED);
                    } else {
                        character.setStatus(Character.Status.COMPLETED);
                    }

                    int result = characterMapper.insert(character);
                    if (result > 0) {
                        successCount++;
                        Map<String, Object> assetData = new HashMap<>();
                        assetData.put("id", character.getId());
                        assetData.put("name", character.getCharacterName());
                        assetData.put("type", character.getCharacterType());
                        assetData.put("status", character.getStatus());
                        assetData.put("imageUrl", character.getCharacterImageUrl());
                        createdAssets.add(assetData);
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
            data.put("assets", createdAssets);

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
}