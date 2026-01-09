package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.ImageGenerationTask;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ImageGenerationTaskMapper extends BaseMapper<ImageGenerationTask> {

    List<ImageGenerationTask> selectPendingTasks(@Param("limit") int limit);

    ImageGenerationTask selectByTaskId(@Param("taskId") String taskId);
}
