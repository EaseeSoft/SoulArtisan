package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.CharacterProjectStoryboard;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 角色项目分镜Mapper
 */
@Mapper
public interface CharacterProjectStoryboardMapper extends BaseMapper<CharacterProjectStoryboard> {

    /**
     * 根据项目ID查询分镜列表
     */
    @Select("SELECT * FROM character_project_storyboards WHERE project_id = #{projectId} ORDER BY scene_number ASC")
    List<CharacterProjectStoryboard> selectByProjectId(@Param("projectId") Long projectId);

    /**
     * 根据项目ID和状态查询分镜列表
     */
    @Select("SELECT * FROM character_project_storyboards WHERE project_id = #{projectId} AND status = #{status} ORDER BY scene_number ASC")
    List<CharacterProjectStoryboard> selectByProjectIdAndStatus(
            @Param("projectId") Long projectId,
            @Param("status") String status
    );

    /**
     * 根据视频任务ID查询分镜
     */
    @Select("SELECT * FROM character_project_storyboards WHERE video_task_id = #{videoTaskId} LIMIT 1")
    CharacterProjectStoryboard selectByVideoTaskId(@Param("videoTaskId") Long videoTaskId);

    /**
     * 根据项目ID删除所有分镜
     */
    @Delete("DELETE FROM character_project_storyboards WHERE project_id = #{projectId}")
    int deleteByProjectId(@Param("projectId") Long projectId);

    /**
     * 统计项目下的分镜数量
     */
    @Select("SELECT COUNT(*) FROM character_project_storyboards WHERE project_id = #{projectId}")
    Long countByProjectId(@Param("projectId") Long projectId);

    /**
     * 统计项目下指定状态的分镜数量
     */
    @Select("SELECT COUNT(*) FROM character_project_storyboards WHERE project_id = #{projectId} AND status = #{status}")
    Long countByProjectIdAndStatus(
            @Param("projectId") Long projectId,
            @Param("status") String status
    );

    /**
     * 获取项目下分镜的最大序号
     */
    @Select("SELECT COALESCE(MAX(scene_number), 0) FROM character_project_storyboards WHERE project_id = #{projectId}")
    Integer getMaxSceneNumber(@Param("projectId") Long projectId);
}
