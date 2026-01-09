package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.admin.entity.SystemConfig;
import com.jf.soulartisan.admin.mapper.SystemConfigMapper;
import com.jf.soulartisan.common.dto.ConcurrencyCheckResult;
import com.jf.soulartisan.common.util.RedisUtil;
import com.jf.soulartisan.entity.ImageGenerationTask;
import com.jf.soulartisan.entity.VideoGenerationTask;
import com.jf.soulartisan.mapper.ImageGenerationTaskMapper;
import com.jf.soulartisan.mapper.VideoGenerationTaskMapper;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 并发限制服务（按用户统计）
 * 使用 Redis 原子操作实现并发控制，避免竞争条件
 */
@Slf4j
@Service
public class ConcurrencyLimitService {

    private static final String IMAGE_LOCK_KEY_PREFIX = "concurrency:image:lock:";
    private static final String VIDEO_LOCK_KEY_PREFIX = "concurrency:video:lock:";
    private static final long LOCK_TTL_SECONDS = 600; // 10分钟过期，防止任务异常时锁未释放
    @Resource
    private SystemConfigMapper systemConfigMapper;
    @Resource
    private ImageGenerationTaskMapper imageTaskMapper;
    @Resource
    private VideoGenerationTaskMapper videoTaskMapper;

    /**
     * 尝试获取图片生成并发槽位（原子操作）
     * 使用 Redis INCR 实现预占位机制，避免并发竞争
     *
     * @param userId 用户ID
     * @return 检查结果，如果允许则已经占用了一个槽位
     */
    public ConcurrencyCheckResult acquireImageSlot(Long userId) {
        if (userId == null) {
            return ConcurrencyCheckResult.allowed();
        }

        SystemConfig config = getSystemConfig();
        int limit = config.getImageConcurrencyLimit() != null
                ? config.getImageConcurrencyLimit()
                : 10; // 默认值

        // 限制为0表示不限制
        if (limit <= 0) {
            return ConcurrencyCheckResult.allowed();
        }

        String lockKey = IMAGE_LOCK_KEY_PREFIX + userId;

        try {
            // 原子递增并获取新值
            long newCount = RedisUtil.increment(lockKey);

            // 如果是第一次设置，添加过期时间
            if (newCount == 1) {
                RedisUtil.expire(lockKey, LOCK_TTL_SECONDS, TimeUnit.SECONDS);
            }

            // 检查是否超过限制
            if (newCount <= limit) {
                log.debug("图片并发槽位获取成功: userId={}, current={}, limit={}", userId, newCount, limit);
                return ConcurrencyCheckResult.allowed();
            }

            // 超过限制，回滚计数
            RedisUtil.decrement(lockKey);
            log.info("图片并发限制: userId={}, current={}, limit={}", userId, newCount - 1, limit);
            return ConcurrencyCheckResult.rejected(limit, newCount - 1);

        } catch (Exception e) {
            log.error("图片并发检查异常，降级到数据库查询: userId={}", userId, e);
            // Redis 异常时降级到数据库查询
            return checkImageConcurrencyFromDb(userId, limit);
        }
    }

    /**
     * 尝试获取视频生成并发槽位（原子操作）
     * 使用 Redis INCR 实现预占位机制，避免并发竞争
     *
     * @param userId 用户ID
     * @return 检查结果，如果允许则已经占用了一个槽位
     */
    public ConcurrencyCheckResult acquireVideoSlot(Long userId) {
        if (userId == null) {
            return ConcurrencyCheckResult.allowed();
        }

        SystemConfig config = getSystemConfig();
        int limit = config.getVideoConcurrencyLimit() != null
                ? config.getVideoConcurrencyLimit()
                : 5; // 默认值

        // 限制为0表示不限制
        if (limit <= 0) {
            return ConcurrencyCheckResult.allowed();
        }

        String lockKey = VIDEO_LOCK_KEY_PREFIX + userId;

        try {
            // 原子递增并获取新值
            long newCount = RedisUtil.increment(lockKey);

            // 如果是第一次设置，添加过期时间
            if (newCount == 1) {
                RedisUtil.expire(lockKey, LOCK_TTL_SECONDS, TimeUnit.SECONDS);
            }

            // 检查是否超过限制
            if (newCount <= limit) {
                log.debug("视频并发槽位获取成功: userId={}, current={}, limit={}", userId, newCount, limit);
                return ConcurrencyCheckResult.allowed();
            }

            // 超过限制，回滚计数
            RedisUtil.decrement(lockKey);
            log.info("视频并发限制: userId={}, current={}, limit={}", userId, newCount - 1, limit);
            return ConcurrencyCheckResult.rejected(limit, newCount - 1);

        } catch (Exception e) {
            log.error("视频并发检查异常，降级到数据库查询: userId={}", userId, e);
            // Redis 异常时降级到数据库查询
            return checkVideoConcurrencyFromDb(userId, limit);
        }
    }

    /**
     * 释放图片生成并发槽位
     * 在任务完成或失败时调用
     *
     * @param userId 用户ID
     */
    public void releaseImageSlot(Long userId) {
        if (userId == null) {
            return;
        }
        try {
            String lockKey = IMAGE_LOCK_KEY_PREFIX + userId;
            long count = RedisUtil.decrement(lockKey);
            // 确保计数不会变成负数
            if (count < 0) {
                RedisUtil.set(lockKey, 0L, LOCK_TTL_SECONDS, TimeUnit.SECONDS);
            }
            log.debug("释放图片并发槽位: userId={}, remaining={}", userId, Math.max(0, count));
        } catch (Exception e) {
            log.warn("释放图片并发槽位失败: userId={}", userId, e);
        }
    }

    /**
     * 释放视频生成并发槽位
     * 在任务完成或失败时调用
     *
     * @param userId 用户ID
     */
    public void releaseVideoSlot(Long userId) {
        if (userId == null) {
            return;
        }
        try {
            String lockKey = VIDEO_LOCK_KEY_PREFIX + userId;
            long count = RedisUtil.decrement(lockKey);
            // 确保计数不会变成负数
            if (count < 0) {
                RedisUtil.set(lockKey, 0L, LOCK_TTL_SECONDS, TimeUnit.SECONDS);
            }
            log.debug("释放视频并发槽位: userId={}, remaining={}", userId, Math.max(0, count));
        } catch (Exception e) {
            log.warn("释放视频并发槽位失败: userId={}", userId, e);
        }
    }

    /**
     * 从数据库检查图片并发（降级方案）
     */
    private ConcurrencyCheckResult checkImageConcurrencyFromDb(Long userId, int limit) {
        long currentCount = imageTaskMapper.selectCount(
                new LambdaQueryWrapper<ImageGenerationTask>()
                        .eq(ImageGenerationTask::getUserId, userId)
                        .in(ImageGenerationTask::getStatus,
                                ImageGenerationTask.Status.PENDING,
                                ImageGenerationTask.Status.PROCESSING)
        );
        if (currentCount < limit) {
            return ConcurrencyCheckResult.allowed();
        }
        return ConcurrencyCheckResult.rejected(limit, currentCount);
    }

    /**
     * 从数据库检查视频并发（降级方案）
     */
    private ConcurrencyCheckResult checkVideoConcurrencyFromDb(Long userId, int limit) {
        long currentCount = videoTaskMapper.selectCount(
                new LambdaQueryWrapper<VideoGenerationTask>()
                        .eq(VideoGenerationTask::getUserId, userId)
                        .in(VideoGenerationTask::getStatus,
                                VideoGenerationTask.Status.PENDING,
                                VideoGenerationTask.Status.RUNNING)
        );
        if (currentCount < limit) {
            return ConcurrencyCheckResult.allowed();
        }
        return ConcurrencyCheckResult.rejected(limit, currentCount);
    }

    /**
     * 兼容旧接口：检查图片并发（已废弃，请使用 acquireImageSlot）
     */
    @Deprecated
    public ConcurrencyCheckResult checkImageConcurrency(Long userId) {
        return acquireImageSlot(userId);
    }

    /**
     * 兼容旧接口：检查视频并发（已废弃，请使用 acquireVideoSlot）
     */
    @Deprecated
    public ConcurrencyCheckResult checkVideoConcurrency(Long userId) {
        return acquireVideoSlot(userId);
    }

    /**
     * 清除用户的并发计数（用于调试或重置）
     *
     * @param userId 用户ID
     */
    public void clearUserConcurrencyCount(Long userId) {
        if (userId == null) {
            return;
        }
        try {
            RedisUtil.delete(IMAGE_LOCK_KEY_PREFIX + userId);
            RedisUtil.delete(VIDEO_LOCK_KEY_PREFIX + userId);
            log.info("清除用户并发计数: userId={}", userId);
        } catch (Exception e) {
            log.warn("清除用户并发计数失败: userId={}", userId, e);
        }
    }

    /**
     * 获取系统配置
     *
     * @return 系统配置
     */
    public SystemConfig getSystemConfig() {
        SystemConfig config = systemConfigMapper.selectById(1L);
        if (config == null) {
            config = new SystemConfig();
            config.setImageConcurrencyLimit(10);
            config.setVideoConcurrencyLimit(5);
        }
        return config;
    }
}
