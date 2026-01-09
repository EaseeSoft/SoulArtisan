package com.jf.soulartisan.service;

import com.jf.soulartisan.admin.entity.PointsConfig;
import com.jf.soulartisan.admin.entity.PointsRecord;
import com.jf.soulartisan.admin.service.PointsConfigService;
import com.jf.soulartisan.admin.service.PointsRecordService;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.entity.User;
import com.jf.soulartisan.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 积分扣除服务
 * 用于在任务执行时扣除用户积分
 */
@Slf4j
@Service
public class PointsDeductService {

    @Autowired
    private PointsConfigService pointsConfigService;

    @Autowired
    private PointsRecordService pointsRecordService;

    @Autowired
    private UserMapper userMapper;

    /**
     * 检查用户积分是否充足
     *
     * @param userId    用户ID
     * @param configKey 配置键
     * @return 是否充足
     */
    public boolean checkBalance(Long userId, String configKey) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            return false;
        }

        Integer requiredPoints = pointsConfigService.getConfigValue(configKey);
        if (requiredPoints == null || requiredPoints <= 0) {
            // 配置为0或未配置，不需要扣分
            return true;
        }

        Integer currentPoints = user.getPoints() != null ? user.getPoints() : 0;
        return currentPoints >= requiredPoints;
    }

    /**
     * 检查用户积分是否充足（视频任务，根据时长）
     *
     * @param userId   用户ID
     * @param duration 视频时长（秒）
     * @return 是否充足
     */
    public boolean checkBalanceForVideo(Long userId, Integer duration) {
        String configKey = PointsConfig.getVideoConfigKey(duration);
        return checkBalance(userId, configKey);
    }

    /**
     * 获取指定功能需要的积分
     *
     * @param userId    用户ID
     * @param configKey 配置键
     * @return 需要的积分值
     */
    public Integer getRequiredPoints(Long userId, String configKey) {
        return pointsConfigService.getConfigValue(configKey);
    }

    /**
     * 获取视频任务需要的积分
     *
     * @param userId   用户ID
     * @param duration 视频时长
     * @return 需要的积分值
     */
    public Integer getRequiredPointsForVideo(Long userId, Integer duration) {
        String configKey = PointsConfig.getVideoConfigKey(duration);
        return getRequiredPoints(userId, configKey);
    }

    /**
     * 扣除积分（用于生图）
     *
     * @param userId   用户ID
     * @param taskId   任务ID（用于记录来源）
     * @param taskType 任务类型描述
     */
    @Transactional(rollbackFor = Exception.class)
    public void deductForImageGeneration(Long userId, Long taskId, String taskType) {
        deduct(userId, PointsConfig.ConfigKey.IMAGE_GENERATION, taskId, "生成图片: " + taskType);
    }

    /**
     * 扣除积分（用于生视频）
     *
     * @param userId   用户ID
     * @param taskId   任务ID
     * @param duration 视频时长
     */
    @Transactional(rollbackFor = Exception.class)
    public void deductForVideoGeneration(Long userId, Long taskId, Integer duration) {
        String configKey = PointsConfig.getVideoConfigKey(duration);
        deduct(userId, configKey, taskId, "生成视频: " + duration + "秒");
    }

    /**
     * 扣除积分（用于Gemini对话）
     *
     * @param userId       用户ID
     * @param chatRecordId 聊天记录ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deductForGeminiChat(Long userId, Long chatRecordId) {
        deduct(userId, PointsConfig.ConfigKey.GEMINI_CHAT, chatRecordId, "AI对话");
    }

    /**
     * 通用积分扣除方法
     *
     * @param userId    用户ID
     * @param configKey 配置键
     * @param sourceId  来源ID（任务ID等）
     * @param remark    备注
     */
    @Transactional(rollbackFor = Exception.class)
    public void deduct(Long userId, String configKey, Long sourceId, String remark) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new ServiceException("用户不存在");
        }

        Integer requiredPoints = pointsConfigService.getConfigValue(configKey);

        // 如果积分为0或功能未启用，不扣分
        if (requiredPoints == null || requiredPoints <= 0) {
            log.info("积分配置为0或未启用，跳过扣分: userId={}, configKey={}", userId, configKey);
            return;
        }

        Integer currentPoints = user.getPoints() != null ? user.getPoints() : 0;

        if (currentPoints < requiredPoints) {
            throw new ServiceException("积分不足，需要" + requiredPoints + "积分，当前积分: " + currentPoints);
        }

        // 扣除积分
        Integer newPoints = currentPoints - requiredPoints;
        user.setPoints(newPoints);
        userMapper.updateById(user);

        // 记录积分变动
        pointsRecordService.recordPoints(
                user.getSiteId(),
                userId,
                PointsRecord.Type.EXPENSE,
                requiredPoints,
                newPoints,
                PointsRecord.Source.TASK_CONSUME,
                sourceId,
                remark,
                null,
                null
        );

        log.info("扣除积分成功: userId={}, configKey={}, points={}, before={}, after={}",
                userId, configKey, requiredPoints, currentPoints, newPoints);
    }

    /**
     * 退还积分（任务失败时使用）
     *
     * @param userId    用户ID
     * @param configKey 配置键
     * @param sourceId  来源ID
     * @param remark    备注
     */
    @Transactional(rollbackFor = Exception.class)
    public void refund(Long userId, String configKey, Long sourceId, String remark) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            log.warn("退还积分失败，用户不存在: userId={}", userId);
            return;
        }

        Integer refundPoints = pointsConfigService.getConfigValue(configKey);

        if (refundPoints == null || refundPoints <= 0) {
            return;
        }

        Integer currentPoints = user.getPoints() != null ? user.getPoints() : 0;
        Integer newPoints = currentPoints + refundPoints;
        user.setPoints(newPoints);
        userMapper.updateById(user);

        // 记录积分变动
        pointsRecordService.recordPoints(
                user.getSiteId(),
                userId,
                PointsRecord.Type.INCOME,
                refundPoints,
                newPoints,
                PointsRecord.Source.TASK_CONSUME,
                sourceId,
                "退还积分: " + remark,
                null,
                null
        );

        log.info("退还积分成功: userId={}, configKey={}, points={}, before={}, after={}",
                userId, configKey, refundPoints, currentPoints, newPoints);
    }

    /**
     * 退还视频生成积分
     *
     * @param userId   用户ID
     * @param taskId   任务ID
     * @param duration 视频时长
     */
    @Transactional(rollbackFor = Exception.class)
    public void refundForVideoGeneration(Long userId, Long taskId, Integer duration) {
        String configKey = PointsConfig.getVideoConfigKey(duration);
        refund(userId, configKey, taskId, "视频生成失败");
    }

    /**
     * 退还图片生成积分
     *
     * @param userId 用户ID
     * @param taskId 任务ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void refundForImageGeneration(Long userId, Long taskId) {
        refund(userId, PointsConfig.ConfigKey.IMAGE_GENERATION, taskId, "图片生成失败");
    }
}
