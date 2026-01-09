package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.Character;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface CharacterMapper extends BaseMapper<Character> {

    /**
     * 根据角色ID查询
     */
    Character selectByCharacterId(@Param("characterId") String characterId);

    /**
     * 根据创建任务ID查询
     */
    Character selectByGenerationTaskId(@Param("generationTaskId") String generationTaskId);

    /**
     * 根据视频任务ID查询角色列表
     */
    List<Character> selectByVideoTaskId(@Param("videoTaskId") String videoTaskId);

    /**
     * 查询待处理的角色任务
     */
    List<Character> selectPendingTasks(@Param("limit") int limit);

    /**
     * 根据用户ID查询角色列表
     */
    List<Character> selectByUserId(@Param("userId") Long userId);

    /**
     * 根据工作流项目ID查询角色列表
     */
    List<Character> selectByWorkflowProjectId(@Param("workflowProjectId") Long workflowProjectId);
}
