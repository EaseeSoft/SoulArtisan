package com.jf.soulartisan.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.dto.picture.BatchCreatePictureResourceRequest;
import com.jf.soulartisan.dto.picture.CreatePictureResourceRequest;
import com.jf.soulartisan.dto.picture.PictureResourceResponse;
import com.jf.soulartisan.entity.PictureResource;
import com.jf.soulartisan.mapper.ScriptMemberMapper;
import com.jf.soulartisan.service.PictureResourceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 图片资源管理接口
 * 用于管理剧本相关的图片资源，包括角色、场景、道具、技能等类型
 */
@Slf4j
@RestController
@RequestMapping("/picture-resource")
@Tag(name = "图片资源管理")
@SaUserCheckLogin
@RequiredArgsConstructor
public class PictureResourceController {

    private final PictureResourceService pictureResourceService;

    @Resource
    private ScriptMemberMapper scriptMemberMapper;

    /**
     * 创建图片资源
     */
    @PostMapping("/create")
    @Operation(summary = "创建图片资源")
    public Result<?> createPictureResource(@Valid @RequestBody CreatePictureResourceRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        // 验证：projectId 和 scriptId 至少需要一个
        if (request.getProjectId() == null && request.getScriptId() == null) {
            return Result.error("项目ID和剧本ID至少需要一个", 400);
        }

        try {
            PictureResource resource = pictureResourceService.createResource(
                    userId,
                    siteId,
                    request.getProjectId(),
                    request.getScriptId(),
                    request.getName(),
                    request.getType(),
                    request.getImageUrl(),
                    request.getPrompt()
            );

            Map<String, Object> data = new HashMap<>();
            data.put("id", resource.getId());
            data.put("name", resource.getName());
            data.put("type", resource.getType());
            data.put("imageUrl", resource.getImageUrl());
            data.put("prompt", resource.getPrompt());
            data.put("status", resource.getStatus());
            data.put("createdAt", resource.getCreatedAt());

            return Result.success(data, "图片资源创建成功");

        } catch (Exception e) {
            log.error("创建图片资源失败: {}", e.getMessage(), e);
            return Result.error("创建图片资源失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 批量创建图片资源
     */
    @PostMapping("/batch-create")
    @Operation(summary = "批量创建图片资源")
    public Result<?> batchCreatePictureResources(@Valid @RequestBody BatchCreatePictureResourceRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        try {
            List<PictureResource> createdResources = pictureResourceService.batchCreateResources(
                    userId,
                    siteId,
                    request.getScriptId(),
                    request.getResources()
            );

            List<Map<String, Object>> resourceList = new ArrayList<>();
            for (PictureResource resource : createdResources) {
                Map<String, Object> resourceData = new HashMap<>();
                resourceData.put("id", resource.getId());
                resourceData.put("name", resource.getName());
                resourceData.put("type", resource.getType());
                resourceData.put("imageUrl", resource.getImageUrl());
                resourceData.put("prompt", resource.getPrompt());
                resourceData.put("status", resource.getStatus());
                resourceData.put("createdAt", resource.getCreatedAt());
                resourceList.add(resourceData);
            }

            Map<String, Object> data = new HashMap<>();
            data.put("scriptId", request.getScriptId());
            data.put("successCount", createdResources.size());
            data.put("resources", resourceList);

            return Result.success(data, String.format("成功创建 %d 个图片资源", createdResources.size()));

        } catch (Exception e) {
            log.error("批量创建图片资源失败: {}", e.getMessage(), e);
            return Result.error("批量创建图片资源失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取资源详情
     */
    @GetMapping("/{id}")
    @Operation(summary = "获取图片资源详情")
    public Result<?> getPictureResource(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            PictureResource resource = pictureResourceService.getById(id);

            if (resource == null) {
                return Result.error("资源不存在", 404);
            }

            if (!resource.getUserId().equals(userId)) {
                return Result.error("无权访问此资源", 403);
            }

            PictureResourceResponse response = new PictureResourceResponse();
            BeanUtils.copyProperties(resource, response);

            return Result.success(response);

        } catch (Exception e) {
            log.error("获取图片资源详情失败: {}", e.getMessage(), e);
            return Result.error("获取图片资源详情失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取剧本下的所有图片资源
     */
    @GetMapping("/script/{scriptId}")
    @Operation(summary = "获取剧本下的所有图片资源")
    public Result<?> getResourcesByScript(
            @PathVariable Long scriptId,
            @RequestParam(required = false) String type) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            // 验证剧本权限（创建者或成员都可以访问）
            if (!scriptMemberMapper.existsByScriptIdAndUserId(scriptId, userId)) {
                return Result.error("无权访问此剧本的资源", 403);
            }

            List<PictureResource> resources;
            if (type != null && !type.isEmpty()) {
                resources = pictureResourceService.getResourcesByScriptIdAndType(scriptId, type);
            } else {
                resources = pictureResourceService.getResourcesByScriptId(scriptId);
            }

            // 转换为响应对象
            List<PictureResourceResponse> responses = resources.stream()
                    .map(r -> {
                        PictureResourceResponse response = new PictureResourceResponse();
                        BeanUtils.copyProperties(r, response);
                        return response;
                    })
                    .collect(Collectors.toList());

            return Result.success(responses);

        } catch (Exception e) {
            log.error("获取剧本图片资源失败: {}", e.getMessage(), e);
            return Result.error("获取剧本图片资源失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取项目下的所有图片资源
     */
    @GetMapping("/project/{projectId}")
    @Operation(summary = "获取项目下的所有图片资源")
    public Result<?> getResourcesByProject(
            @PathVariable Long projectId,
            @RequestParam(required = false) String type) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            List<PictureResource> resources;
            if (type != null && !type.isEmpty()) {
                resources = pictureResourceService.getResourcesByProjectIdAndType(projectId, type);
            } else {
                resources = pictureResourceService.getResourcesByProjectId(projectId);
            }

            // 过滤出当前用户的资源
            List<PictureResource> userResources = resources.stream()
                    .filter(r -> r.getUserId().equals(userId))
                    .toList();

            // 转换为响应对象
            List<PictureResourceResponse> responses = userResources.stream()
                    .map(r -> {
                        PictureResourceResponse response = new PictureResourceResponse();
                        BeanUtils.copyProperties(r, response);
                        return response;
                    })
                    .collect(Collectors.toList());

            return Result.success(responses);

        } catch (Exception e) {
            log.error("获取项目图片资源失败: {}", e.getMessage(), e);
            return Result.error("获取项目图片资源失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 根据类型获取图片资源列表
     */
    @GetMapping("/type/{type}")
    @Operation(summary = "根据类型获取图片资源列表")
    public Result<?> getResourcesByType(@PathVariable String type) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            List<PictureResource> allResources = pictureResourceService.getResourcesByType(type);

            // 过滤出当前用户的资源
            List<PictureResource> userResources = allResources.stream()
                    .filter(r -> r.getUserId().equals(userId))
                    .toList();

            List<PictureResourceResponse> responses = userResources.stream()
                    .map(r -> {
                        PictureResourceResponse response = new PictureResourceResponse();
                        BeanUtils.copyProperties(r, response);
                        return response;
                    })
                    .collect(Collectors.toList());

            return Result.success(responses);

        } catch (Exception e) {
            log.error("获取图片资源列表失败: {}", e.getMessage(), e);
            return Result.error("获取图片资源列表失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 分页查询图片资源
     */
    @GetMapping("/page")
    @Operation(summary = "分页查询图片资源")
    public Result<?> pageResources(
            @RequestParam(required = false) Long scriptId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "1") Long current,
            @RequestParam(defaultValue = "10") Long size
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            LambdaQueryWrapper<PictureResource> queryWrapper = new LambdaQueryWrapper<>();

            // 如果指定了 scriptId，检查用户是否是剧本的成员
            if (scriptId != null) {
                // 验证剧本权限（创建者或成员都可以访问）
                if (!scriptMemberMapper.existsByScriptIdAndUserId(scriptId, userId)) {
                    return Result.error("无权访问此剧本的资源", 403);
                }
                // 成员可以查看剧本下的所有资源
                queryWrapper.eq(PictureResource::getScriptId, scriptId);
            } else {
                // 如果没有指定 scriptId，只查询用户自己的资源
                queryWrapper.eq(PictureResource::getUserId, userId);
            }

            if (type != null && !type.isEmpty()) {
                queryWrapper.eq(PictureResource::getType, type);
            }
            if (status != null && !status.isEmpty()) {
                queryWrapper.eq(PictureResource::getStatus, status);
            }

            // 按创建时间倒序
            queryWrapper.orderByDesc(PictureResource::getCreatedAt);

            Page<PictureResource> pageParam = new Page<>(current, size);
            IPage<PictureResource> pageResult = pictureResourceService.page(pageParam, queryWrapper);

            // 转换为响应对象
            IPage<PictureResourceResponse> responsePage = pageResult.convert(r -> {
                PictureResourceResponse response = new PictureResourceResponse();
                BeanUtils.copyProperties(r, response);
                return response;
            });

            return Result.success(responsePage);

        } catch (Exception e) {
            log.error("分页查询图片资源失败: {}", e.getMessage(), e);
            return Result.error("分页查询图片资源失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 更新图片地址
     */
    @PutMapping("/{id}/image-url")
    @Operation(summary = "更新图片地址")
    public Result<?> updateImageUrl(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            PictureResource resource = pictureResourceService.getById(id);
            if (resource == null) {
                return Result.error("资源不存在", 404);
            }

            if (!resource.getUserId().equals(userId)) {
                return Result.error("无权修改此资源", 403);
            }

            String imageUrl = request.get("imageUrl");
            if (imageUrl == null || imageUrl.trim().isEmpty()) {
                return Result.error("图片地址不能为空", 400);
            }

            boolean result = pictureResourceService.updateImageUrl(id, imageUrl.trim());

            if (result) {
                return Result.success(null, "更新图片地址成功");
            } else {
                return Result.error("更新图片地址失败", 500);
            }

        } catch (Exception e) {
            log.error("更新图片地址失败: {}", e.getMessage(), e);
            return Result.error("更新图片地址失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 更新提示词
     */
    @PutMapping("/{id}/prompt")
    @Operation(summary = "更新提示词")
    public Result<?> updatePrompt(
            @PathVariable Long id,
            @RequestBody Map<String, String> request
    ) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            PictureResource resource = pictureResourceService.getById(id);
            if (resource == null) {
                return Result.error("资源不存在", 404);
            }

            if (!resource.getUserId().equals(userId)) {
                return Result.error("无权修改此资源", 403);
            }

            String prompt = request.get("prompt");
            boolean result = pictureResourceService.updatePrompt(id, prompt != null ? prompt.trim() : null);

            if (result) {
                return Result.success(null, "更新提示词成功");
            } else {
                return Result.error("更新提示词失败", 500);
            }

        } catch (Exception e) {
            log.error("更新提示词失败: {}", e.getMessage(), e);
            return Result.error("更新提示词失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 删除图片资源
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "删除图片资源")
    public Result<?> deletePictureResource(@PathVariable Long id) {
        Long userId = StpKit.USER.getLoginIdAsLong();

        try {
            PictureResource resource = pictureResourceService.getById(id);
            if (resource == null) {
                return Result.error("资源不存在", 404);
            }

            if (!resource.getUserId().equals(userId)) {
                return Result.error("无权删除此资源", 403);
            }

            boolean result = pictureResourceService.removeById(id);
            if (result) {
                return Result.success(null, "删除图片资源成功");
            } else {
                return Result.error("删除图片资源失败", 500);
            }

        } catch (Exception e) {
            log.error("删除图片资源失败: {}", e.getMessage(), e);
            return Result.error("删除图片资源失败: " + e.getMessage(), 500);
        }
    }
}
