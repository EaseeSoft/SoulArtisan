package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.VideoGenerationTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface VideoGenerationTaskMapper extends BaseMapper<VideoGenerationTask> {

    /**
     * 查询待处理的任务
     *
     * @param limit 最多返回的任务数
     * @return 待处理的任务
     */
    default List<VideoGenerationTask> selectPendingTasks(@Param("limit") int limit) {
        LambdaQueryWrapper<VideoGenerationTask> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(VideoGenerationTask::getStatus, VideoGenerationTask.Status.PENDING);
        queryWrapper.last("limit " + limit);
        return selectList(queryWrapper);
    }

    /**
     * 根据任务ID查询任务
     *
     * @param taskId 任务ID
     * @return 任务
     */
    default VideoGenerationTask selectByTaskId(@Param("taskId") String taskId) {
        LambdaQueryWrapper<VideoGenerationTask> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(VideoGenerationTask::getTaskId, taskId);
        queryWrapper.last("limit 1");
        return selectOne(queryWrapper);
    }
}
