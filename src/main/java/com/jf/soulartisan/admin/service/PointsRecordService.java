package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.admin.dto.request.PointsAdjustRequest;
import com.jf.soulartisan.admin.dto.request.PointsRecordQueryRequest;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.entity.PointsRecord;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.admin.mapper.PointsRecordMapper;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.entity.User;
import com.jf.soulartisan.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 积分记录服务
 */
@Slf4j
@Service
public class PointsRecordService {

    @Autowired
    private PointsRecordMapper pointsRecordMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private AdminUserMapper adminUserMapper;

    /**
     * 记录积分变动
     *
     * @param siteId       站点ID
     * @param userId       用户ID
     * @param type         类型: 1-收入 2-支出
     * @param points       积分值（正数）
     * @param balance      变动后余额
     * @param source       来源
     * @param sourceId     来源关联ID
     * @param remark       备注
     * @param operatorId   操作人ID
     * @param operatorName 操作人名称
     */
    public void recordPoints(Long siteId, Long userId, Integer type, Integer points,
                             Integer balance, String source, Long sourceId,
                             String remark, Long operatorId, String operatorName) {
        PointsRecord record = new PointsRecord();
        record.setSiteId(siteId);
        record.setUserId(userId);
        record.setType(type);
        record.setPoints(points);
        record.setBalance(balance);
        record.setSource(source);
        record.setSourceId(sourceId);
        record.setRemark(remark);
        record.setOperatorId(operatorId);
        record.setOperatorName(operatorName);

        pointsRecordMapper.insert(record);

        log.info("记录积分变动: userId={}, type={}, points={}, balance={}, source={}",
                userId, type, points, balance, source);
    }

    /**
     * 获取积分记录列表（分页）
     *
     * @param siteId   站点ID
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @param request  查询条件
     * @return 积分记录列表
     */
    public PageResult<Map<String, Object>> getRecordList(Long siteId, Integer pageNum, Integer pageSize,
                                                         PointsRecordQueryRequest request) {
        Page<PointsRecord> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<PointsRecord> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(PointsRecord::getSiteId, siteId);

        if (request != null) {
            if (request.getUserId() != null) {
                queryWrapper.eq(PointsRecord::getUserId, request.getUserId());
            }
            if (request.getType() != null) {
                queryWrapper.eq(PointsRecord::getType, request.getType());
            }
            if (StringUtils.hasText(request.getSource())) {
                queryWrapper.eq(PointsRecord::getSource, request.getSource());
            }
            // 如果按用户名查询，先查出用户ID
            if (StringUtils.hasText(request.getUsername())) {
                LambdaQueryWrapper<User> userQuery = new LambdaQueryWrapper<>();
                userQuery.eq(User::getSiteId, siteId)
                        .like(User::getUsername, request.getUsername())
                        .select(User::getId);
                List<User> users = userMapper.selectList(userQuery);
                if (users.isEmpty()) {
                    // 没有匹配的用户，返回空结果
                    PageResult<Map<String, Object>> emptyResult = new PageResult<>();
                    emptyResult.setList(List.of());
                    emptyResult.setTotal(0L);
                    emptyResult.setPage(pageNum);
                    emptyResult.setPageSize(pageSize);
                    return emptyResult;
                }
                List<Long> userIds = users.stream().map(User::getId).collect(Collectors.toList());
                queryWrapper.in(PointsRecord::getUserId, userIds);
            }
        }

        queryWrapper.orderByDesc(PointsRecord::getCreatedAt);

        Page<PointsRecord> recordPage = pointsRecordMapper.selectPage(page, queryWrapper);

        // 获取用户信息
        List<Long> userIds = recordPage.getRecords().stream()
                .map(PointsRecord::getUserId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, User> userMap = new HashMap<>();
        if (!userIds.isEmpty()) {
            List<User> users = userMapper.selectBatchIds(userIds);
            userMap = users.stream().collect(Collectors.toMap(User::getId, u -> u));
        }

        // 转换为带用户信息的结果
        Map<Long, User> finalUserMap = userMap;
        List<Map<String, Object>> resultList = recordPage.getRecords().stream().map(record -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", record.getId());
            map.put("siteId", record.getSiteId());
            map.put("userId", record.getUserId());
            map.put("type", record.getType());
            map.put("points", record.getPoints());
            map.put("balance", record.getBalance());
            map.put("source", record.getSource());
            map.put("sourceId", record.getSourceId());
            map.put("remark", record.getRemark());
            map.put("operatorId", record.getOperatorId());
            map.put("operatorName", record.getOperatorName());
            map.put("createdAt", record.getCreatedAt());

            User user = finalUserMap.get(record.getUserId());
            if (user != null) {
                map.put("username", user.getUsername());
                map.put("nickname", user.getNickname());
            }

            return map;
        }).collect(Collectors.toList());

        PageResult<Map<String, Object>> pageResult = new PageResult<>();
        pageResult.setList(resultList);
        pageResult.setTotal(recordPage.getTotal());
        pageResult.setPage(pageNum);
        pageResult.setPageSize(pageSize);

        return pageResult;
    }

    /**
     * 管理员调整用户积分
     *
     * @param siteId  站点ID
     * @param request 调整请求
     */
    @Transactional(rollbackFor = Exception.class)
    public void adjustPoints(Long siteId, PointsAdjustRequest request) {
        // 参数校验
        if (request.getUserId() == null) {
            throw new ServiceException("用户ID不能为空");
        }
        if (request.getType() == null || (request.getType() != 1 && request.getType() != 2)) {
            throw new ServiceException("类型必须为1(增加)或2(扣减)");
        }
        if (request.getPoints() == null || request.getPoints() <= 0) {
            throw new ServiceException("积分值必须大于0");
        }

        // 查找用户
        User user = userMapper.selectById(request.getUserId());
        if (user == null || !user.getSiteId().equals(siteId)) {
            throw new ServiceException("用户不存在");
        }

        // 获取当前管理员信息
        Long adminId = StpKit.ADMIN.getLoginIdAsLong();
        AdminUser adminUser = adminUserMapper.selectById(adminId);
        String operatorName = adminUser != null ? adminUser.getRealName() : "未知";

        // 计算新积分
        Integer currentPoints = user.getPoints() != null ? user.getPoints() : 0;
        Integer newPoints;
        Integer recordType;

        if (request.getType() == 1) {
            // 增加积分
            newPoints = currentPoints + request.getPoints();
            recordType = PointsRecord.Type.INCOME;
        } else {
            // 扣减积分
            if (currentPoints < request.getPoints()) {
                throw new ServiceException("用户积分不足，当前积分: " + currentPoints);
            }
            newPoints = currentPoints - request.getPoints();
            recordType = PointsRecord.Type.EXPENSE;
        }

        // 更新用户积分
        user.setPoints(newPoints);
        userMapper.updateById(user);

        // 记录积分变动
        recordPoints(siteId, user.getId(), recordType, request.getPoints(),
                newPoints, PointsRecord.Source.ADMIN_ADJUST, null,
                request.getRemark(), adminId, operatorName);

        log.info("管理员调整积分: userId={}, type={}, points={}, oldBalance={}, newBalance={}, operator={}",
                user.getId(), request.getType(), request.getPoints(), currentPoints, newPoints, operatorName);
    }

    /**
     * 获取用户积分记录（用户端）
     *
     * @param userId   用户ID
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @return 积分记录列表
     */
    public PageResult<PointsRecord> getUserRecordList(Long userId, Integer pageNum, Integer pageSize) {
        Page<PointsRecord> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<PointsRecord> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(PointsRecord::getUserId, userId)
                .orderByDesc(PointsRecord::getCreatedAt);

        Page<PointsRecord> recordPage = pointsRecordMapper.selectPage(page, queryWrapper);

        PageResult<PointsRecord> pageResult = new PageResult<>();
        pageResult.setList(recordPage.getRecords());
        pageResult.setTotal(recordPage.getTotal());
        pageResult.setPage(pageNum);
        pageResult.setPageSize(pageSize);

        return pageResult;
    }
}
