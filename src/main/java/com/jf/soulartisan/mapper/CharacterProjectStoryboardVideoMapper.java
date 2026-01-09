package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.CharacterProjectStoryboardVideo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 分镜视频 Mapper
 */
@Mapper
public interface CharacterProjectStoryboardVideoMapper extends BaseMapper<CharacterProjectStoryboardVideo> {

    /**
     * 根据分镜ID获取视频列表
     */
    @Select("SELECT * FROM character_project_storyboard_videos WHERE storyboard_id = #{storyboardId} ORDER BY sort_order ASC, created_at DESC")
    List<CharacterProjectStoryboardVideo> selectByStoryboardId(@Param("storyboardId") Long storyboardId);

    /**
     * 根据项目ID获取所有视频
     */
    @Select("SELECT * FROM character_project_storyboard_videos WHERE project_id = #{projectId} ORDER BY storyboard_id ASC, sort_order ASC")
    List<CharacterProjectStoryboardVideo> selectByProjectId(@Param("projectId") Long projectId);
}
