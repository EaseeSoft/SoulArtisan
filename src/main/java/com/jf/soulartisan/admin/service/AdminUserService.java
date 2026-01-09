package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.admin.context.SiteContext;
import com.jf.soulartisan.admin.dto.request.UserCreateRequest;
import com.jf.soulartisan.admin.dto.request.UserQueryRequest;
import com.jf.soulartisan.admin.dto.request.UserUpdateRequest;
import com.jf.soulartisan.admin.dto.response.UserDetailResponse;
import com.jf.soulartisan.admin.dto.response.UserStatsResponse;
import com.jf.soulartisan.admin.entity.Site;
import com.jf.soulartisan.admin.mapper.SiteMapper;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.util.BeanUtils;
import com.jf.soulartisan.entity.User;
import com.jf.soulartisan.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * 用户管理服务
 */
@Slf4j
@Service
public class AdminUserService {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private SiteMapper siteMapper;

    /**
     * 获取用户列表（自动按站点过滤）
     *
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @param request  查询请求
     * @return 用户列表
     */
    public PageResult<UserDetailResponse> getUserList(Integer pageNum, Integer pageSize, UserQueryRequest request) {
        Page<User> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();

        // 站点数据隔离：站点管理员只能查看自己站点的用户
        Long siteId = SiteContext.getSiteId();
        log.info("📊 获取用户列表 - 当前站点上下文: siteId={}, 请求参数siteId={}", siteId, request.getSiteId());
        
        if (siteId != null) {
            queryWrapper.eq(User::getSiteId, siteId);
            log.info("✅ 站点管理员查询 - 仅查询站点 {} 的用户", siteId);
        } else if (request.getSiteId() != null) {
            // 系统管理员可以指定站点ID查询
            queryWrapper.eq(User::getSiteId, request.getSiteId());
            log.info("✅ 系统管理员查询 - 指定查询站点 {} 的用户", request.getSiteId());
        } else {
            log.info("✅ 系统管理员查询 - 查询所有站点的用户");
        }

        // 查询条件
        if (StringUtils.hasText(request.getUsername())) {
            queryWrapper.like(User::getUsername, request.getUsername());
        }
        if (StringUtils.hasText(request.getNickname())) {
            queryWrapper.like(User::getNickname, request.getNickname());
        }
        if (StringUtils.hasText(request.getEmail())) {
            queryWrapper.like(User::getEmail, request.getEmail());
        }
        if (StringUtils.hasText(request.getPhone())) {
            queryWrapper.like(User::getPhone, request.getPhone());
        }
        if (request.getStatus() != null) {
            queryWrapper.eq(User::getStatus, request.getStatus());
        }

        queryWrapper.orderByDesc(User::getCreatedAt);

        Page<User> userPage = userMapper.selectPage(page, queryWrapper);

        // 转换为响应对象
        List<UserDetailResponse> responseList = BeanUtils.toBean(userPage.getRecords(), UserDetailResponse.class);

        // 填充站点名称
        for (int i = 0; i < responseList.size(); i++) {
            UserDetailResponse response = responseList.get(i);
            User user = userPage.getRecords().get(i);

            if (user.getSiteId() != null) {
                Site site = siteMapper.selectById(user.getSiteId());
                if (site != null) {
                    response.setSiteName(site.getSiteName());
                }
            }

            // TODO: 填充统计数据（项目数、任务数）
            response.setProjectCount(0L);
            response.setImageTaskCount(0L);
            response.setVideoTaskCount(0L);
        }

        PageResult<UserDetailResponse> pageResult = new PageResult<>();
        pageResult.setList(responseList);
        pageResult.setTotal(userPage.getTotal());
        pageResult.setPage(pageNum);
        pageResult.setPageSize(pageSize);

        return pageResult;
    }

    /**
     * 获取用户详情
     *
     * @param userId 用户ID
     * @return 用户详情
     */
    public UserDetailResponse getUserDetail(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new ServiceException("用户不存在");
        }

        // 站点数据隔离检查
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && !currentSiteId.equals(user.getSiteId())) {
            throw new ServiceException("无权限访问该用户");
        }

        UserDetailResponse response = BeanUtils.toBean(user, UserDetailResponse.class);

        // 填充站点名称
        if (user.getSiteId() != null) {
            Site site = siteMapper.selectById(user.getSiteId());
            if (site != null) {
                response.setSiteName(site.getSiteName());
            }
        }

        // TODO: 填充统计数据
        response.setProjectCount(0L);
        response.setImageTaskCount(0L);
        response.setVideoTaskCount(0L);

        return response;
    }

    /**
     * 修改用户状态（封禁/解封）
     *
     * @param userId 用户ID
     * @param status 状态
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateUserStatus(Long userId, Integer status) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new ServiceException("用户不存在");
        }

        // 站点数据隔离检查
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && !currentSiteId.equals(user.getSiteId())) {
            throw new ServiceException("无权限操作该用户");
        }

        user.setStatus(status);
        userMapper.updateById(user);

        log.info("修改用户状态成功: userId={}, status={}", userId, status);
    }

    /**
     * 删除用户
     *
     * @param userId 用户ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteUser(Long userId) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new ServiceException("用户不存在");
        }

        // 站点数据隔离检查
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && !currentSiteId.equals(user.getSiteId())) {
            throw new ServiceException("无权限删除该用户");
        }

        // TODO: 检查是否有关联数据（项目、任务等）

        userMapper.deleteById(userId);

        log.info("删除用户成功: userId={}", userId);
    }

    /**
     * 重置用户密码
     *
     * @param userId      用户ID
     * @param newPassword 新密码
     */
    @Transactional(rollbackFor = Exception.class)
    public void resetUserPassword(Long userId, String newPassword) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new ServiceException("用户不存在");
        }

        // 站点数据隔离检查
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && !currentSiteId.equals(user.getSiteId())) {
            throw new ServiceException("无权限操作该用户");
        }

        user.setPassword(SecurityUtils.encryptPassword(newPassword));
        userMapper.updateById(user);

        log.info("重置用户密码成功: userId={}", userId);
    }

    /**
     * 更新用户信息
     *
     * @param userId  用户ID
     * @param request 更新请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void updateUser(Long userId, UserUpdateRequest request) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new ServiceException("用户不存在");
        }

        // 站点数据隔离检查
        Long currentSiteId = SiteContext.getSiteId();
        if (currentSiteId != null && !currentSiteId.equals(user.getSiteId())) {
            throw new ServiceException("无权限操作该用户");
        }

        // 更新用户信息
        if (StringUtils.hasText(request.getNickname())) {
            user.setNickname(request.getNickname());
        }
        if (StringUtils.hasText(request.getEmail())) {
            user.setEmail(request.getEmail());
        }
        if (StringUtils.hasText(request.getPhone())) {
            user.setPhone(request.getPhone());
        }

        userMapper.updateById(user);

        log.info("更新用户信息成功: userId={}", userId);
    }

    /**
     * 创建用户（仅站点管理员可用）
     *
     * @param request 创建请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void createUser(UserCreateRequest request) {
        // 获取当前站点ID
        Long siteId = SiteContext.getSiteId();
        if (siteId == null) {
            throw new ServiceException("仅站点管理员可以创建用户");
        }

        // 检查同站点下用户名是否已存在
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getSiteId, siteId)
                .eq(User::getUsername, request.getUsername());
        User existingUser = userMapper.selectOne(queryWrapper);
        if (existingUser != null) {
            throw new ServiceException("该用户名已存在");
        }

        // 创建用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(SecurityUtils.encryptPassword(request.getPassword()));
        user.setNickname(request.getNickname());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPoints(request.getPoints() != null ? request.getPoints() : 0);
        user.setSiteId(siteId);
        user.setStatus(User.Status.ENABLED);
        user.setRole(User.Role.USER);

        userMapper.insert(user);

        log.info("创建用户成功: username={}, siteId={}", request.getUsername(), siteId);
    }

    /**
     * 获取用户统计数据
     *
     * @return 统计数据
     */
    public UserStatsResponse getUserStats() {
        UserStatsResponse stats = new UserStatsResponse();

        Long currentSiteId = SiteContext.getSiteId();

        // 今日时间范围
        LocalDateTime todayStart = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime todayEnd = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        // 本周时间范围
        LocalDate today = LocalDate.now();
        LocalDateTime weekStart = LocalDateTime.of(today.minusDays(today.getDayOfWeek().getValue() - 1), LocalTime.MIN);
        LocalDateTime weekEnd = LocalDateTime.of(today, LocalTime.MAX);

        // 本月时间范围
        LocalDateTime monthStart = LocalDateTime.of(today.withDayOfMonth(1), LocalTime.MIN);
        LocalDateTime monthEnd = LocalDateTime.of(today, LocalTime.MAX);

        if (currentSiteId != null) {
            // 站点管理员统计
            stats.setTotalUsers(userMapper.countBySiteId(currentSiteId));
            stats.setEnabledUsers(userMapper.countBySiteIdAndStatus(currentSiteId, User.Status.ENABLED));
            stats.setDisabledUsers(userMapper.countBySiteIdAndStatus(currentSiteId, User.Status.DISABLED));
            stats.setTodayNewUsers(userMapper.countBySiteIdAndCreatedAtBetween(currentSiteId, todayStart, todayEnd));
            stats.setWeekNewUsers(userMapper.countBySiteIdAndCreatedAtBetween(currentSiteId, weekStart, weekEnd));
            stats.setMonthNewUsers(userMapper.countBySiteIdAndCreatedAtBetween(currentSiteId, monthStart, monthEnd));
        } else {
            // 系统管理员统计
            stats.setTotalUsers(userMapper.selectCount(null));
            stats.setEnabledUsers(userMapper.countByStatus(User.Status.ENABLED));
            stats.setDisabledUsers(userMapper.countByStatus(User.Status.DISABLED));
            stats.setTodayNewUsers(userMapper.countByCreatedAtBetween(todayStart, todayEnd));
            stats.setWeekNewUsers(userMapper.countByCreatedAtBetween(weekStart, weekEnd));
            stats.setMonthNewUsers(userMapper.countByCreatedAtBetween(monthStart, monthEnd));
        }

        return stats;
    }
}
