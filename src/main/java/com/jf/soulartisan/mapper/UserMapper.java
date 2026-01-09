package com.jf.soulartisan.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jf.soulartisan.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;

@Mapper
public interface UserMapper extends BaseMapper<User> {

    User selectByUsername(@Param("username") String username);

    /**
     * 统计指定站点的用户数量
     *
     * @param siteId 站点ID
     * @return 用户数量
     */
    Long countBySiteId(@Param("siteId") Long siteId);

    /**
     * 统计指定站点指定状态的用户数量
     *
     * @param siteId 站点ID
     * @param status 用户状态
     * @return 用户数量
     */
    Long countBySiteIdAndStatus(@Param("siteId") Long siteId, @Param("status") Integer status);

    /**
     * 统计指定站点指定时间范围内新增的用户数量
     *
     * @param siteId    站点ID
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @return 用户数量
     */
    Long countBySiteIdAndCreatedAtBetween(@Param("siteId") Long siteId,
                                          @Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);

    /**
     * 统计所有站点指定状态的用户数量
     *
     * @param status 用户状态
     * @return 用户数量
     */
    Long countByStatus(@Param("status") Integer status);

    /**
     * 统计所有站点指定时间范围内新增的用户数量
     *
     * @param startTime 开始时间
     * @param endTime   结束时间
     * @return 用户数量
     */
    Long countByCreatedAtBetween(@Param("startTime") LocalDateTime startTime,
                                 @Param("endTime") LocalDateTime endTime);
}
