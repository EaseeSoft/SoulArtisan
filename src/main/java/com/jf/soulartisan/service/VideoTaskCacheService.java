package com.jf.soulartisan.service;

import com.jf.soulartisan.common.util.RedisUtil;
import com.jf.soulartisan.entity.VideoGenerationTask;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

/**
 * 视频任务缓存服务
 */
@Slf4j
@Service
public class VideoTaskCacheService {

    private static final String VIDEO_TASK_CACHE_PREFIX = "video:task:";
    private static final long CACHE_EXPIRE_MINUTES = 1;

    /**
     * 生成缓存key
     *
     * @param taskId 数据库任务ID
     * @return 缓存key
     */
    private String getCacheKey(Long taskId) {
        return VIDEO_TASK_CACHE_PREFIX + taskId;
    }

    /**
     * 保存视频任务到缓存
     *
     * @param task 视频任务
     */
    public void saveTask(VideoGenerationTask task) {
        if (task == null || task.getId() == null) {
            log.warn("保存缓存失败：任务或任务ID为空");
            return;
        }

        try {
            String key = getCacheKey(task.getId());
            RedisUtil.set(key, task, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);

            // 立即验证是否保存成功
            boolean hasKey = RedisUtil.hasKey(key);
            log.info("保存视频任务到缓存：id={}, key={}, status={}, verified={}",
                    task.getId(), key, task.getStatus(), hasKey);

            if (!hasKey) {
                log.error("Redis保存后立即验证失败：key不存在 key={}", key);
            }
        } catch (Exception e) {
            log.error("保存视频任务到缓存失败：id={}, error={}", task.getId(), e.getMessage(), e);
        }
    }

    /**
     * 从缓存获取视频任务
     *
     * @param taskId 数据库任务ID
     * @return 视频任务，不存在返回null
     */
    public VideoGenerationTask getTask(Long taskId) {
        if (taskId == null) {
            return null;
        }

        try {
            String key = getCacheKey(taskId);

            // 检查key是否存在
            boolean hasKey = RedisUtil.hasKey(key);
            log.info("检查Redis key是否存在：key={}, exists={}", key, hasKey);

            if (!hasKey) {
                log.info("Redis中不存在该key：id={}, key={}", taskId, key);
                return null;
            }

            VideoGenerationTask value = RedisUtil.get(key, VideoGenerationTask.class);

            if (value == null) {
                log.warn("Redis key存在但value为null：id={}, key={}", taskId, key);
                return null;
            }

            log.info("从Redis获取到数据：id={}, status={}", taskId, value.getStatus());
            log.info("从缓存获取视频任务成功：id={}", taskId);
            return value;

        } catch (Exception e) {
            log.error("从缓存获取视频任务失败：id={}, error={}", taskId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * 更新缓存中的视频任务
     *
     * @param task 视频任务
     */
    public void updateTask(VideoGenerationTask task) {
        if (task == null || task.getId() == null) {
            log.warn("更新缓存失败：任务或任务ID为空");
            return;
        }

        try {
            String key = getCacheKey(task.getId());
            // 检查缓存是否存在
            boolean hasKey = RedisUtil.hasKey(key);
            if (hasKey) {
                // 存在则更新，保持原有的过期时间
                long expire = RedisUtil.getExpire(key);
                if (expire > 0) {
                    RedisUtil.set(key, task, expire, TimeUnit.SECONDS);
                    log.debug("更新视频任务缓存成功：id={}, remaining_seconds={}", task.getId(), expire);
                } else {
                    // 如果没有过期时间或已过期，重新设置为3分钟
                    RedisUtil.set(key, task, CACHE_EXPIRE_MINUTES, TimeUnit.MINUTES);
                    log.debug("更新视频任务缓存成功（重置过期时间）：id={}", task.getId());
                }
            } else {
                log.debug("缓存中不存在该任务，跳过更新：id={}", task.getId());
            }
        } catch (Exception e) {
            log.error("更新视频任务缓存失败：id={}, error={}", task.getId(), e.getMessage(), e);
        }
    }

    /**
     * 删除缓存中的视频任务
     *
     * @param taskId 数据库任务ID
     */
    public void deleteTask(Long taskId) {
        if (taskId == null) {
            return;
        }

        try {
            String key = getCacheKey(taskId);
            RedisUtil.delete(key);
            log.debug("删除视频任务缓存成功：id={}", taskId);
        } catch (Exception e) {
            log.error("删除视频任务缓存失败：id={}, error={}", taskId, e.getMessage(), e);
        }
    }

    /**
     * 检查缓存中是否存在该任务
     *
     * @param taskId 数据库任务ID
     * @return 存在返回true，否则返回false
     */
    public boolean exists(Long taskId) {
        if (taskId == null) {
            return false;
        }

        try {
            String key = getCacheKey(taskId);
            return RedisUtil.hasKey(key);
        } catch (Exception e) {
            log.error("检查视频任务缓存是否存在失败：id={}, error={}", taskId, e.getMessage(), e);
            return false;
        }
    }
}
