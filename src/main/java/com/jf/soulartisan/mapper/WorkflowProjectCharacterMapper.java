package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.WorkflowProjectCharacter;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * @deprecated 此Mapper已废弃，角色与项目的关联关系已迁移到 Character 实体
 */
@Deprecated
@Mapper
public interface WorkflowProjectCharacterMapper extends BaseMapper<WorkflowProjectCharacter> {

    /**
     * 根据工作流项目ID查询关联的角色列表
     */
    List<WorkflowProjectCharacter> selectByProjectId(@Param("projectId") Long projectId);

    /**
     * 根据角色ID查询关联的项目列表
     */
    List<WorkflowProjectCharacter> selectByCharacterId(@Param("characterId") Long characterId);

    /**
     * 查询项目中的某个角色关联
     */
    WorkflowProjectCharacter selectByProjectAndCharacter(
            @Param("projectId") Long projectId,
            @Param("characterId") Long characterId
    );

    /**
     * 更新角色使用次数
     */
    int incrementUsageCount(
            @Param("projectId") Long projectId,
            @Param("characterId") Long characterId
    );
}
