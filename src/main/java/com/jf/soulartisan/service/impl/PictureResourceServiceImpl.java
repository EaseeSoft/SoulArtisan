package com.jf.soulartisan.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jf.soulartisan.dto.picture.BatchCreatePictureResourceRequest;
import com.jf.soulartisan.entity.PictureResource;
import com.jf.soulartisan.mapper.PictureResourceMapper;
import com.jf.soulartisan.service.PictureResourceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

/**
 * 图片资源服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PictureResourceServiceImpl extends ServiceImpl<PictureResourceMapper, PictureResource>
        implements PictureResourceService {

    @Override
    @Transactional
    public PictureResource createResource(Long userId, Long siteId, Long projectId, Long scriptId, String name, String type, String imageUrl, String prompt) {
        PictureResource resource = new PictureResource();
        resource.setUserId(userId);
        resource.setSiteId(siteId);
        resource.setProjectId(projectId);
        resource.setScriptId(scriptId);
        resource.setName(name);
        resource.setType(type);
        resource.setImageUrl(imageUrl);
        resource.setPrompt(prompt);
        // 手动添加默认为已生成状态
        resource.setStatus(PictureResource.Status.GENERATED);

        save(resource);
        log.info("创建图片资源成功: resourceId={}, userId={}, projectId={}, scriptId={}, name={}, type={}, prompt={}",
                resource.getId(), userId, projectId, scriptId, name, type, prompt);

        return resource;
    }

    @Override
    public List<PictureResource> getResourcesByUserId(Long userId) {
        return baseMapper.selectByUserId(userId);
    }

    @Override
    public List<PictureResource> getResourcesBySiteId(Long siteId) {
        return baseMapper.selectBySiteId(siteId);
    }

    @Override
    public List<PictureResource> getResourcesByProjectId(Long projectId) {
        return baseMapper.selectByProjectId(projectId);
    }

    @Override
    public List<PictureResource> getResourcesByProjectIdAndType(Long projectId, String type) {
        return baseMapper.selectByProjectIdAndType(projectId, type);
    }

    @Override
    public List<PictureResource> getResourcesByScriptId(Long scriptId) {
        return baseMapper.selectByScriptId(scriptId);
    }

    @Override
    public List<PictureResource> getResourcesByScriptIdAndType(Long scriptId, String type) {
        return baseMapper.selectByScriptIdAndType(scriptId, type);
    }

    @Override
    public List<PictureResource> getResourcesByType(String type) {
        return baseMapper.selectByType(type);
    }

    @Override
    @Transactional
    public boolean updateImageUrl(Long resourceId, String imageUrl) {
        PictureResource resource = new PictureResource();
        resource.setId(resourceId);
        resource.setImageUrl(imageUrl);
        // 更新图片URL时同时将状态设置为已生成
        resource.setStatus(PictureResource.Status.GENERATED);

        boolean result = updateById(resource);
        if (result) {
            log.info("更新图片资源地址成功: resourceId={}, imageUrl={}, status=generated", resourceId, imageUrl);
        }
        return result;
    }

    @Override
    @Transactional
    public boolean updatePrompt(Long resourceId, String prompt) {
        PictureResource resource = new PictureResource();
        resource.setId(resourceId);
        resource.setPrompt(prompt);

        boolean result = updateById(resource);
        if (result) {
            log.info("更新图片资源提示词成功: resourceId={}, prompt={}", resourceId, prompt);
        }
        return result;
    }

    @Override
    @Transactional
    public List<PictureResource> batchCreateResources(Long userId, Long siteId, Long scriptId,
                                                      List<BatchCreatePictureResourceRequest.ResourceItem> resources) {
        List<PictureResource> createdResources = new ArrayList<>();

        for (BatchCreatePictureResourceRequest.ResourceItem item : resources) {
            PictureResource resource = new PictureResource();
            resource.setUserId(userId);
            resource.setSiteId(siteId);
            resource.setScriptId(scriptId);
            resource.setName(item.getName());
            resource.setType(item.getType());
            resource.setPrompt(item.getPrompt());
            resource.setImageUrl(item.getImageUrl());

            // 根据图片是否存在设置状态
            if (!StringUtils.hasText(item.getImageUrl())) {
                resource.setStatus(PictureResource.Status.PENDING);
            } else {
                resource.setStatus(PictureResource.Status.GENERATED);
            }

            save(resource);
            createdResources.add(resource);
        }

        log.info("批量创建图片资源成功: userId={}, scriptId={}, count={}",
                userId, scriptId, createdResources.size());

        return createdResources;
    }
}
