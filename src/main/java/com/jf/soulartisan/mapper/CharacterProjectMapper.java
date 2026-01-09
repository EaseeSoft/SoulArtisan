package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.CharacterProject;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 角色项目Mapper
 */
@Mapper
public interface CharacterProjectMapper extends BaseMapper<CharacterProject> {

    /**
     * 根据用户ID查询项目列表
     */
    @Select("SELECT * FROM character_projects WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<CharacterProject> selectByUserId(@Param("userId") Long userId);

    /**
     * 根据用户ID和状态查询项目列表
     */
    @Select("SELECT * FROM character_projects WHERE user_id = #{userId} AND status = #{status} ORDER BY created_at DESC")
    List<CharacterProject> selectByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") String status
    );

    /**
     * 根据剧本ID查询项目列表
     */
    @Select("SELECT * FROM character_projects WHERE script_id = #{scriptId} ORDER BY created_at DESC")
    List<CharacterProject> selectByScriptId(@Param("scriptId") Long scriptId);

    /**
     * 统计用户的项目数量
     */
    @Select("SELECT COUNT(*) FROM character_projects WHERE user_id = #{userId}")
    Long countByUserId(@Param("userId") Long userId);
}
