package com.jf.soulartisan.admin.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.admin.entity.AdminOperationLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 管理员操作日志表 Mapper
 */
@Mapper
public interface AdminOperationLogMapper extends BaseMapper<AdminOperationLog> {

}
