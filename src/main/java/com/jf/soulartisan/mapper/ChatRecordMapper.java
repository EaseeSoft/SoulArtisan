package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.ChatRecord;
import org.apache.ibatis.annotations.Mapper;

/**
 * AI聊天记录 Mapper
 */
@Mapper
public interface ChatRecordMapper extends BaseMapper<ChatRecord> {
}
