package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.CharacterProjectResource;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 角色项目资源关联Mapper
 */
@Mapper
public interface CharacterProjectResourceMapper extends BaseMapper<CharacterProjectResource> {

    /**
     * 根据项目ID查询关联列表
     */
    @Select("SELECT * FROM character_project_resources WHERE project_id = #{projectId} ORDER BY sort_order ASC, created_at ASC")
    List<CharacterProjectResource> selectByProjectId(@Param("projectId") Long projectId);

    /**
     * 根据资源ID查询关联列表
     */
    @Select("SELECT * FROM character_project_resources WHERE resource_id = #{resourceId}")
    List<CharacterProjectResource> selectByResourceId(@Param("resourceId") Long resourceId);

    /**
     * 根据项目ID和资源ID查询关联
     */
    @Select("SELECT * FROM character_project_resources WHERE project_id = #{projectId} AND resource_id = #{resourceId} LIMIT 1")
    CharacterProjectResource selectByProjectIdAndResourceId(
            @Param("projectId") Long projectId,
            @Param("resourceId") Long resourceId
    );

    /**
     * 根据项目ID删除所有关联
     */
    @Delete("DELETE FROM character_project_resources WHERE project_id = #{projectId}")
    int deleteByProjectId(@Param("projectId") Long projectId);

    /**
     * 根据项目ID和资源ID删除关联
     */
    @Delete("DELETE FROM character_project_resources WHERE project_id = #{projectId} AND resource_id = #{resourceId}")
    int deleteByProjectIdAndResourceId(
            @Param("projectId") Long projectId,
            @Param("resourceId") Long resourceId
    );

    /**
     * 统计项目下的资源数量
     */
    @Select("SELECT COUNT(*) FROM character_project_resources WHERE project_id = #{projectId}")
    Long countByProjectId(@Param("projectId") Long projectId);

    /**
     * 根据来源类型统计项目下的资源数量
     */
    @Select("SELECT COUNT(*) FROM character_project_resources WHERE project_id = #{projectId} AND source_type = #{sourceType}")
    Long countByProjectIdAndSourceType(
            @Param("projectId") Long projectId,
            @Param("sourceType") String sourceType
    );

    /**
     * 获取项目下资源的最大排序号
     */
    @Select("SELECT COALESCE(MAX(sort_order), 0) FROM character_project_resources WHERE project_id = #{projectId}")
    Integer getMaxSortOrder(@Param("projectId") Long projectId);
}
