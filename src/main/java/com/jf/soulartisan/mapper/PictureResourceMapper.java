package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.PictureResource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 图片资源Mapper接口
 */
@Mapper
public interface PictureResourceMapper extends BaseMapper<PictureResource> {

    /**
     * 根据用户ID查询图片资源列表
     */
    List<PictureResource> selectByUserId(@Param("userId") Long userId);

    /**
     * 根据站点ID查询图片资源列表
     */
    List<PictureResource> selectBySiteId(@Param("siteId") Long siteId);

    /**
     * 根据项目ID查询图片资源列表
     */
    List<PictureResource> selectByProjectId(@Param("projectId") Long projectId);

    /**
     * 根据项目ID和类型查询图片资源列表
     */
    List<PictureResource> selectByProjectIdAndType(@Param("projectId") Long projectId, @Param("type") String type);

    /**
     * 根据剧本ID查询图片资源列表
     */
    List<PictureResource> selectByScriptId(@Param("scriptId") Long scriptId);

    /**
     * 根据剧本ID和类型查询图片资源列表
     */
    List<PictureResource> selectByScriptIdAndType(@Param("scriptId") Long scriptId, @Param("type") String type);

    /**
     * 根据类型查询图片资源列表
     */
    List<PictureResource> selectByType(@Param("type") String type);
}
