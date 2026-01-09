package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.CharacterProjectStoryboardResource;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 分镜资源关联Mapper
 */
@Mapper
public interface CharacterProjectStoryboardResourceMapper extends BaseMapper<CharacterProjectStoryboardResource> {

    /**
     * 根据分镜ID查询关联列表
     */
    @Select("SELECT * FROM character_project_storyboard_resources WHERE storyboard_id = #{storyboardId} ORDER BY sort_order ASC, created_at ASC")
    List<CharacterProjectStoryboardResource> selectByStoryboardId(@Param("storyboardId") Long storyboardId);

    /**
     * 根据资源ID查询关联列表
     */
    @Select("SELECT * FROM character_project_storyboard_resources WHERE resource_id = #{resourceId}")
    List<CharacterProjectStoryboardResource> selectByResourceId(@Param("resourceId") Long resourceId);

    /**
     * 根据分镜ID和资源ID查询关联
     */
    @Select("SELECT * FROM character_project_storyboard_resources WHERE storyboard_id = #{storyboardId} AND resource_id = #{resourceId} LIMIT 1")
    CharacterProjectStoryboardResource selectByStoryboardIdAndResourceId(
            @Param("storyboardId") Long storyboardId,
            @Param("resourceId") Long resourceId
    );

    /**
     * 根据分镜ID和角色类型查询关联列表
     */
    @Select("SELECT * FROM character_project_storyboard_resources WHERE storyboard_id = #{storyboardId} AND resource_role = #{resourceRole} ORDER BY sort_order ASC")
    List<CharacterProjectStoryboardResource> selectByStoryboardIdAndRole(
            @Param("storyboardId") Long storyboardId,
            @Param("resourceRole") String resourceRole
    );

    /**
     * 根据分镜ID删除所有关联
     */
    @Delete("DELETE FROM character_project_storyboard_resources WHERE storyboard_id = #{storyboardId}")
    int deleteByStoryboardId(@Param("storyboardId") Long storyboardId);

    /**
     * 根据分镜ID和资源ID删除关联
     */
    @Delete("DELETE FROM character_project_storyboard_resources WHERE storyboard_id = #{storyboardId} AND resource_id = #{resourceId}")
    int deleteByStoryboardIdAndResourceId(
            @Param("storyboardId") Long storyboardId,
            @Param("resourceId") Long resourceId
    );

    /**
     * 统计分镜下的资源数量
     */
    @Select("SELECT COUNT(*) FROM character_project_storyboard_resources WHERE storyboard_id = #{storyboardId}")
    Long countByStoryboardId(@Param("storyboardId") Long storyboardId);

    /**
     * 获取分镜下资源的最大排序号
     */
    @Select("SELECT COALESCE(MAX(sort_order), 0) FROM character_project_storyboard_resources WHERE storyboard_id = #{storyboardId}")
    Integer getMaxSortOrder(@Param("storyboardId") Long storyboardId);
}
