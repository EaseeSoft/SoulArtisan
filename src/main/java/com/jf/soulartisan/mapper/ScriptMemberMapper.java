package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.ScriptMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 剧本成员 Mapper
 */
@Mapper
public interface ScriptMemberMapper extends BaseMapper<ScriptMember> {

    /**
     * 根据剧本ID获取成员列表（包含用户信息）
     *
     * @param scriptId 剧本ID
     * @return 成员列表
     */
    @Select("SELECT sm.id, sm.script_id, sm.user_id, sm.role, sm.created_at, " +
            "u.username, u.nickname, u.avatar " +
            "FROM script_members sm " +
            "LEFT JOIN users u ON sm.user_id = u.id " +
            "WHERE sm.script_id = #{scriptId} " +
            "ORDER BY FIELD(sm.role, 'creator', 'member'), sm.created_at ASC")
    List<Map<String, Object>> selectMembersWithUserInfo(@Param("scriptId") Long scriptId);

    /**
     * 查询用户参与的剧本ID列表
     *
     * @param userId 用户ID
     * @return 剧本ID列表
     */
    @Select("SELECT script_id FROM script_members WHERE user_id = #{userId}")
    List<Long> selectScriptIdsByUserId(@Param("userId") Long userId);

    /**
     * 查询用户在剧本中的角色
     *
     * @param scriptId 剧本ID
     * @param userId   用户ID
     * @return 角色
     */
    @Select("SELECT role FROM script_members WHERE script_id = #{scriptId} AND user_id = #{userId}")
    String selectRoleByScriptIdAndUserId(@Param("scriptId") Long scriptId, @Param("userId") Long userId);

    /**
     * 检查用户是否是剧本成员
     *
     * @param scriptId 剧本ID
     * @param userId   用户ID
     * @return 是否存在
     */
    @Select("SELECT COUNT(*) > 0 FROM script_members WHERE script_id = #{scriptId} AND user_id = #{userId}")
    boolean existsByScriptIdAndUserId(@Param("scriptId") Long scriptId, @Param("userId") Long userId);
}
