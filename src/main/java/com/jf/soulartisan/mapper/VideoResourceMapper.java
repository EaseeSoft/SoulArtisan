package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.VideoResource;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 视频资源Mapper
 */
@Mapper
public interface VideoResourceMapper extends BaseMapper<VideoResource> {

    /**
     * 根据角色生成任务ID查询
     */
    @Select("SELECT * FROM video_resources WHERE generation_task_id = #{generationTaskId} LIMIT 1")
    VideoResource selectByGenerationTaskId(@Param("generationTaskId") String generationTaskId);

    /**
     * 根据视频任务ID查询
     */
    @Select("SELECT * FROM video_resources WHERE video_task_id = #{videoTaskId}")
    List<VideoResource> selectByVideoTaskId(@Param("videoTaskId") String videoTaskId);

    /**
     * 根据角色ID查询
     */
    @Select("SELECT * FROM video_resources WHERE character_id = #{characterId} LIMIT 1")
    VideoResource selectByCharacterId(@Param("characterId") String characterId);

    /**
     * 根据剧本ID查询资源列表
     */
    @Select("SELECT * FROM video_resources WHERE script_id = #{scriptId} ORDER BY created_at DESC")
    List<VideoResource> selectByScriptId(@Param("scriptId") Long scriptId);

    /**
     * 根据剧本ID和资源类型查询
     */
    @Select("SELECT * FROM video_resources WHERE script_id = #{scriptId} AND resource_type = #{resourceType} ORDER BY created_at DESC")
    List<VideoResource> selectByScriptIdAndType(
            @Param("scriptId") Long scriptId,
            @Param("resourceType") String resourceType
    );

    /**
     * 根据项目ID查询资源列表
     */
    @Select("SELECT * FROM video_resources WHERE workflow_project_id = #{projectId} ORDER BY created_at DESC")
    List<VideoResource> selectByProjectId(@Param("projectId") Long projectId);

    /**
     * 根据项目ID和资源类型查询
     */
    @Select("SELECT * FROM video_resources WHERE workflow_project_id = #{projectId} AND resource_type = #{resourceType} ORDER BY created_at DESC")
    List<VideoResource> selectByProjectIdAndType(
            @Param("projectId") Long projectId,
            @Param("resourceType") String resourceType
    );

    /**
     * 根据用户ID查询资源列表
     */
    @Select("SELECT * FROM video_resources WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<VideoResource> selectByUserId(@Param("userId") Long userId);

    /**
     * 查询待处理的资源
     */
    @Select("SELECT * FROM video_resources WHERE status = 'pending' ORDER BY created_at ASC LIMIT #{limit}")
    List<VideoResource> selectPendingResources(@Param("limit") int limit);

    /**
     * 统计剧本下的资源数量
     */
    @Select("SELECT COUNT(*) FROM video_resources WHERE script_id = #{scriptId}")
    Long countByScriptId(@Param("scriptId") Long scriptId);

    /**
     * 统计剧本下指定类型的资源数量
     */
    @Select("SELECT COUNT(*) FROM video_resources WHERE script_id = #{scriptId} AND resource_type = #{resourceType}")
    Long countByScriptIdAndType(
            @Param("scriptId") Long scriptId,
            @Param("resourceType") String resourceType
    );

    /**
     * 统计项目下的资源数量
     */
    @Select("SELECT COUNT(*) FROM video_resources WHERE workflow_project_id = #{projectId}")
    Long countByProjectId(@Param("projectId") Long projectId);
}
