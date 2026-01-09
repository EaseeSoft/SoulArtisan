package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.Script;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 剧本Mapper
 */
@Mapper
public interface ScriptMapper extends BaseMapper<Script> {

    /**
     * 统计剧本下的角色数量
     */
    @Select("SELECT COUNT(*) FROM characters WHERE script_id = #{scriptId}")
    Long countCharactersByScriptId(Long scriptId);

    /**
     * 统计使用该剧本的项目数量
     */
    @Select("SELECT COUNT(*) FROM workflow_projects WHERE script_id = #{scriptId}")
    Long countProjectsByScriptId(Long scriptId);

    /**
     * 统计剧本下的图片资源数量
     */
    @Select("SELECT COUNT(*) FROM picture_resources WHERE script_id = #{scriptId}")
    Long countPictureResourcesByScriptId(Long scriptId);

    /**
     * 统计剧本下的视频资源数量
     */
    @Select("SELECT COUNT(*) FROM video_resources WHERE script_id = #{scriptId}")
    Long countVideoResourcesByScriptId(Long scriptId);
}
