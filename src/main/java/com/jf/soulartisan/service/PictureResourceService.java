package com.jf.soulartisan.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jf.soulartisan.entity.PictureResource;

import java.util.List;

/**
 * 图片资源服务接口
 */
public interface PictureResourceService extends IService<PictureResource> {

    /**
     * 创建图片资源
     *
     * @param userId    用户ID
     * @param siteId    站点ID
     * @param projectId 项目ID（可选）
     * @param scriptId  剧本ID（可选）
     * @param name      资源名称
     * @param type      资源类型
     * @param imageUrl  图片地址
     * @param prompt    提示词
     * @return 创建的资源
     */
    PictureResource createResource(Long userId, Long siteId, Long projectId, Long scriptId, String name, String type, String imageUrl, String prompt);

    /**
     * 根据用户ID查询图片资源列表
     *
     * @param userId 用户ID
     * @return 资源列表
     */
    List<PictureResource> getResourcesByUserId(Long userId);

    /**
     * 根据站点ID查询图片资源列表
     *
     * @param siteId 站点ID
     * @return 资源列表
     */
    List<PictureResource> getResourcesBySiteId(Long siteId);

    /**
     * 根据项目ID查询图片资源列表
     *
     * @param projectId 项目ID
     * @return 资源列表
     */
    List<PictureResource> getResourcesByProjectId(Long projectId);

    /**
     * 根据项目ID和类型查询图片资源列表
     *
     * @param projectId 项目ID
     * @param type      资源类型
     * @return 资源列表
     */
    List<PictureResource> getResourcesByProjectIdAndType(Long projectId, String type);

    /**
     * 根据剧本ID查询图片资源列表
     *
     * @param scriptId 剧本ID
     * @return 资源列表
     */
    List<PictureResource> getResourcesByScriptId(Long scriptId);

    /**
     * 根据剧本ID和类型查询图片资源列表
     *
     * @param scriptId 剧本ID
     * @param type     资源类型
     * @return 资源列表
     */
    List<PictureResource> getResourcesByScriptIdAndType(Long scriptId, String type);

    /**
     * 根据类型查询图片资源列表
     *
     * @param type 资源类型
     * @return 资源列表
     */
    List<PictureResource> getResourcesByType(String type);

    /**
     * 更新图片地址
     *
     * @param resourceId 资源ID
     * @param imageUrl   新图片地址
     * @return 是否成功
     */
    boolean updateImageUrl(Long resourceId, String imageUrl);

    /**
     * 更新提示词
     *
     * @param resourceId 资源ID
     * @param prompt     新提示词
     * @return 是否成功
     */
    boolean updatePrompt(Long resourceId, String prompt);

    /**
     * 批量创建图片资源
     *
     * @param userId    用户ID
     * @param siteId    站点ID
     * @param scriptId  剧本ID
     * @param resources 资源列表
     * @return 创建的资源列表
     */
    List<PictureResource> batchCreateResources(Long userId, Long siteId, Long scriptId,
                                               List<com.jf.soulartisan.dto.picture.BatchCreatePictureResourceRequest.ResourceItem> resources);
}
