package com.jf.soulartisan.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.admin.entity.ChatPrompt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * AI 聊天提示词配置 Mapper
 */
@Mapper
public interface ChatPromptMapper extends BaseMapper<ChatPrompt> {

    /**
     * 根据场景编码查询提示词配置
     *
     * @param code 场景编码
     * @return 提示词配置
     */
    ChatPrompt selectByCode(@Param("code") String code);

    /**
     * 查询所有启用的提示词配置
     *
     * @return 启用的提示词配置列表
     */
    List<ChatPrompt> selectAllEnabled();

    /**
     * 查询所有提示词配置（按排序顺序）
     *
     * @return 提示词配置列表
     */
    List<ChatPrompt> selectAllOrderBySortOrder();
}
