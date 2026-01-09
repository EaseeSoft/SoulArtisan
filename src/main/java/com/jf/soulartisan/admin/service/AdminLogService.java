package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.admin.context.SiteContext;
import com.jf.soulartisan.admin.dto.request.LogQueryRequest;
import com.jf.soulartisan.admin.entity.AdminLoginLog;
import com.jf.soulartisan.admin.entity.AdminOperationLog;
import com.jf.soulartisan.admin.mapper.AdminLoginLogMapper;
import com.jf.soulartisan.admin.mapper.AdminOperationLogMapper;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.security.SecurityUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 日志管理服务
 */
@Slf4j
@Service
public class AdminLogService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private AdminOperationLogMapper operationLogMapper;

    @Autowired
    private AdminLoginLogMapper loginLogMapper;

    @Autowired
    private AdminUserMapper adminUserMapper;

    /**
     * 获取操作日志列表（自动按站点过滤）
     *
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @param request  查询条件
     * @return 分页结果
     */
    public PageResult<AdminOperationLog> getOperationLogs(Integer pageNum, Integer pageSize, LogQueryRequest request) {
        // 创建分页对象
        Page<AdminOperationLog> page = new Page<>(pageNum, pageSize);

        // 构建查询条件
        LambdaQueryWrapper<AdminOperationLog> queryWrapper = new LambdaQueryWrapper<>();

        // 站点数据隔离：站点管理员只能看到自己站点的日志
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null) {
            queryWrapper.eq(AdminOperationLog::getSiteId, currentSiteId);
        } else if (request != null && request.getSiteId() != null) {
            // 系统管理员可以按站点过滤
            queryWrapper.eq(AdminOperationLog::getSiteId, request.getSiteId());
        }

        // 其他查询条件
        if (request != null) {
            if (request.getAdminId() != null) {
                queryWrapper.eq(AdminOperationLog::getAdminId, request.getAdminId());
            }
            if (StringUtils.hasText(request.getAdminName())) {
                queryWrapper.like(AdminOperationLog::getAdminName, request.getAdminName());
            }
            if (StringUtils.hasText(request.getModule())) {
                queryWrapper.eq(AdminOperationLog::getModule, request.getModule());
            }
            if (StringUtils.hasText(request.getOperation())) {
                queryWrapper.eq(AdminOperationLog::getOperation, request.getOperation());
            }
            if (request.getStatus() != null) {
                queryWrapper.eq(AdminOperationLog::getStatus, request.getStatus());
            }
            if (StringUtils.hasText(request.getIp())) {
                queryWrapper.like(AdminOperationLog::getIp, request.getIp());
            }
            if (StringUtils.hasText(request.getStartTime())) {
                LocalDateTime startTime = LocalDateTime.parse(request.getStartTime(), DATE_TIME_FORMATTER);
                queryWrapper.ge(AdminOperationLog::getCreatedAt, startTime);
            }
            if (StringUtils.hasText(request.getEndTime())) {
                LocalDateTime endTime = LocalDateTime.parse(request.getEndTime(), DATE_TIME_FORMATTER);
                queryWrapper.le(AdminOperationLog::getCreatedAt, endTime);
            }
        }

        // 按创建时间倒序排列
        queryWrapper.orderByDesc(AdminOperationLog::getCreatedAt);

        // 执行分页查询
        Page<AdminOperationLog> result = operationLogMapper.selectPage(page, queryWrapper);

        // 转换为 PageResult
        return PageResult.of(result.getRecords(), result.getTotal(), (int) result.getCurrent(), (int) result.getSize());
    }

    /**
     * 获取登录日志列表（自动按站点过滤）
     *
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @param request  查询条件
     * @return 分页结果
     */
    public PageResult<AdminLoginLog> getLoginLogs(Integer pageNum, Integer pageSize, LogQueryRequest request) {
        // 创建分页对象
        Page<AdminLoginLog> page = new Page<>(pageNum, pageSize);

        // 构建查询条件
        LambdaQueryWrapper<AdminLoginLog> queryWrapper = new LambdaQueryWrapper<>();

        // 站点数据隔离：这里登录日志没有 siteId，需要通过 adminId 关联
        // 如果是站点管理员，通过当前管理员ID过滤
        Long currentSiteId = SiteContext.getSiteId();

        // 如果是站点管理员（有 siteId），只能看自己的登录日志
        if (currentSiteId != null) {
            Long currentAdminId = SecurityUtils.getAdminLoginUserId();
            queryWrapper.eq(AdminLoginLog::getAdminId, currentAdminId);
        }

        // 其他查询条件
        if (request != null) {
            // 系统管理员可以查看指定管理员的日志
            if (currentSiteId == null && request.getAdminId() != null) {
                queryWrapper.eq(AdminLoginLog::getAdminId, request.getAdminId());
            }
            if (StringUtils.hasText(request.getAdminName())) {
                queryWrapper.like(AdminLoginLog::getUsername, request.getAdminName());
            }
            if (request.getStatus() != null) {
                queryWrapper.eq(AdminLoginLog::getStatus, request.getStatus());
            }
            if (StringUtils.hasText(request.getIp())) {
                queryWrapper.like(AdminLoginLog::getIp, request.getIp());
            }
            if (StringUtils.hasText(request.getStartTime())) {
                LocalDateTime startTime = LocalDateTime.parse(request.getStartTime(), DATE_TIME_FORMATTER);
                queryWrapper.ge(AdminLoginLog::getCreatedAt, startTime); // Changed from getLoginTime to getLoginTime
            }
            if (StringUtils.hasText(request.getEndTime())) {
                LocalDateTime endTime = LocalDateTime.parse(request.getEndTime(), DATE_TIME_FORMATTER);
                queryWrapper.le(AdminLoginLog::getCreatedAt, endTime); // Changed from getLoginTime to getLoginTime
            }
        }

        // 按登录时间倒序排列
        queryWrapper.orderByDesc(AdminLoginLog::getCreatedAt);

        // 执行分页查询
        Page<AdminLoginLog> result = loginLogMapper.selectPage(page, queryWrapper);

        // 转换为 PageResult
        return PageResult.of(result.getRecords(), result.getTotal(), (int) result.getCurrent(), (int) result.getSize());
    }

    /**
     * 获取操作日志详情
     *
     * @param logId 日志ID
     * @return 日志详情
     */
    public AdminOperationLog getOperationLogDetail(Long logId) {
        AdminOperationLog log = operationLogMapper.selectById(logId);

        // 站点数据隔离检查
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && log != null && !currentSiteId.equals(log.getSiteId())) {
            throw new RuntimeException("无权访问该日志");
        }

        return log;
    }

    /**
     * 获取登录日志详情
     *
     * @param logId 日志ID
     * @return 日志详情
     */
    public AdminLoginLog getLoginLogDetail(Long logId) {
        AdminLoginLog log = loginLogMapper.selectById(logId);

        // 站点管理员只能查看自己的登录日志
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && log != null) {
            Long currentAdminId = SecurityUtils.getAdminLoginUserId();
            if (!currentAdminId.equals(log.getAdminId())) {
                throw new RuntimeException("无权访问该日志");
            }
        }

        return log;
    }
}
