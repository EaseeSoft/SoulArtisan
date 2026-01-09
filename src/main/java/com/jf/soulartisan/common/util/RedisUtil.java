package com.jf.soulartisan.common.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Redis 工具类
 * 提供常用的 Redis 操作静态方法
 */
@Slf4j
public class RedisUtil {

    private static RedisTemplate<String, Object> redisTemplate;

    /**
     * 获取 RedisTemplate
     */
    private static RedisTemplate<String, Object> getRedisTemplate() {
        if (redisTemplate == null) {
            synchronized (RedisUtil.class) {
                if (redisTemplate == null) {
                    redisTemplate = SpringContextHolder.getBean(RedisTemplate.class);
                }
            }
        }
        if (redisTemplate == null) {
            throw new IllegalStateException("RedisTemplate 未初始化，请检查 Redis 配置");
        }
        return redisTemplate;
    }

    /**
     * 设置 RedisTemplate（由 Spring 自动注入）
     */
    @SuppressWarnings("unchecked")
    public static void setRedisTemplate(RedisTemplate<?, ?> template) {
        RedisUtil.redisTemplate = (RedisTemplate<String, Object>) template;
    }

    // ============================= 通用操作 =============================

    /**
     * 设置过期时间
     *
     * @param key     键
     * @param timeout 时间量
     * @param unit    时间单位
     * @return true=设置成功, false=设置失败
     */
    public static boolean expire(String key, long timeout, TimeUnit unit) {
        try {
            Boolean result = getRedisTemplate().expire(key, timeout, unit);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("设置过期时间失败: key={}, error={}", key, e.getMessage());
            return false;
        }
    }

    /**
     * 获取过期时间
     *
     * @param key 键
     * @return 过期时间（秒），-1表示永不过期，-2表示key不存在
     */
    public static long getExpire(String key) {
        try {
            Long expire = getRedisTemplate().getExpire(key, TimeUnit.SECONDS);
            return expire != null ? expire : -2;
        } catch (Exception e) {
            log.error("获取过期时间失败: key={}, error={}", key, e.getMessage());
            return -2;
        }
    }

    /**
     * 判断 key 是否存在
     *
     * @param key 键
     * @return true=存在, false=不存在
     */
    public static boolean hasKey(String key) {
        try {
            Boolean result = getRedisTemplate().hasKey(key);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("判断key是否存在失败: key={}, error={}", key, e.getMessage());
            return false;
        }
    }

    /**
     * 删除 key
     *
     * @param key 键
     * @return true=删除成功, false=删除失败
     */
    public static boolean delete(String key) {
        try {
            Boolean result = getRedisTemplate().delete(key);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("删除key失败: key={}, error={}", key, e.getMessage());
            return false;
        }
    }

    /**
     * 批量删除 key
     *
     * @param keys 键集合
     * @return 删除的数量
     */
    public static long delete(Collection<String> keys) {
        try {
            Long count = getRedisTemplate().delete(keys);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("批量删除key失败: keys={}, error={}", keys, e.getMessage());
            return 0;
        }
    }

    // ============================= String 操作 =============================

    /**
     * 获取缓存值
     *
     * @param key 键
     * @return 值
     */
    public static Object get(String key) {
        try {
            return getRedisTemplate().opsForValue().get(key);
        } catch (Exception e) {
            log.error("获取缓存失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 获取缓存值并指定类型
     *
     * @param key   键
     * @param clazz 类型
     * @return 值
     */
    @SuppressWarnings("unchecked")
    public static <T> T get(String key, Class<T> clazz) {
        try {
            Object value = getRedisTemplate().opsForValue().get(key);
            if (value == null) {
                return null;
            }
            if (clazz.isInstance(value)) {
                return (T) value;
            }
            log.warn("缓存值类型不匹配: key={}, expected={}, actual={}",
                    key, clazz.getName(), value.getClass().getName());
            return null;
        } catch (Exception e) {
            log.error("获取缓存失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 获取字符串值
     *
     * @param key 键
     * @return 值
     */
    public static String getStr(String key) {
        Object value = get(key);
        return value != null ? String.valueOf(value) : null;
    }

    /**
     * 获取整数值
     *
     * @param key 键
     * @return 值，不存在或类型错误返回0
     */
    public static int getInt(String key) {
        Object value = get(key);
        if (value == null) {
            return 0;
        }
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(value));
        } catch (NumberFormatException e) {
            log.warn("转换为int失败: key={}, value={}", key, value);
            return 0;
        }
    }

    /**
     * 获取长整数值
     *
     * @param key 键
     * @return 值，不存在或类型错误返回0
     */
    public static long getLong(String key) {
        Object value = get(key);
        if (value == null) {
            return 0L;
        }
        if (value instanceof Number) {
            return ((Number) value).longValue();
        }
        try {
            return Long.parseLong(String.valueOf(value));
        } catch (NumberFormatException e) {
            log.warn("转换为long失败: key={}, value={}", key, value);
            return 0L;
        }
    }

    /**
     * 设置缓存
     *
     * @param key   键
     * @param value 值
     */
    public static void set(String key, Object value) {
        try {
            getRedisTemplate().opsForValue().set(key, value);
        } catch (Exception e) {
            log.error("设置缓存失败: key={}, error={}", key, e.getMessage());
        }
    }

    /**
     * 设置缓存并指定过期时间
     *
     * @param key     键
     * @param value   值
     * @param timeout 时间量
     * @param unit    时间单位
     */
    public static void set(String key, Object value, long timeout, TimeUnit unit) {
        try {
            getRedisTemplate().opsForValue().set(key, value, timeout, unit);
        } catch (Exception e) {
            log.error("设置缓存失败: key={}, error={}", key, e.getMessage());
        }
    }

    /**
     * 设置缓存（过期时间-秒）
     */
    public static void set(String key, Object value, long seconds) {
        set(key, value, seconds, TimeUnit.SECONDS);
    }

    /**
     * 如果 key 不存在则设置
     *
     * @param key   键
     * @param value 值
     * @return true=设置成功, false=key已存在
     */
    public static boolean setIfAbsent(String key, Object value) {
        try {
            Boolean result = getRedisTemplate().opsForValue().setIfAbsent(key, value);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("设置缓存失败: key={}, error={}", key, e.getMessage());
            return false;
        }
    }

    /**
     * 如果 key 不存在则设置（带过期时间）
     *
     * @param key     键
     * @param value   值
     * @param timeout 时间量
     * @param unit    时间单位
     * @return true=设置成功, false=key已存在
     */
    public static boolean setIfAbsent(String key, Object value, long timeout, TimeUnit unit) {
        try {
            Boolean result = getRedisTemplate().opsForValue().setIfAbsent(key, value, timeout, unit);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("设置缓存失败: key={}, error={}", key, e.getMessage());
            return false;
        }
    }

    /**
     * 值递增
     *
     * @param key 键
     * @return 递增后的值
     */
    public static long increment(String key) {
        try {
            Long result = getRedisTemplate().opsForValue().increment(key);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("值递增失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 值按指定数量递增
     *
     * @param key   键
     * @param delta 增量
     * @return 递增后的值
     */
    public static long increment(String key, long delta) {
        try {
            Long result = getRedisTemplate().opsForValue().increment(key, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("值递增失败: key={}, delta={}, error={}", key, delta, e.getMessage());
            return 0;
        }
    }

    /**
     * 值递减
     *
     * @param key 键
     * @return 递减后的值
     */
    public static long decrement(String key) {
        try {
            Long result = getRedisTemplate().opsForValue().decrement(key);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("值递减失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 值按指定数量递减
     *
     * @param key   键
     * @param delta 减量
     * @return 递减后的值
     */
    public static long decrement(String key, long delta) {
        try {
            Long result = getRedisTemplate().opsForValue().decrement(key, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("值递减失败: key={}, delta={}, error={}", key, delta, e.getMessage());
            return 0;
        }
    }

    // ============================= Hash 操作 =============================

    /**
     * 获取 Hash 中的值
     *
     * @param key     键
     * @param hashKey Hash键
     * @return 值
     */
    public static Object hGet(String key, String hashKey) {
        try {
            return getRedisTemplate().opsForHash().get(key, hashKey);
        } catch (Exception e) {
            log.error("获取Hash失败: key={}, hashKey={}, error={}", key, hashKey, e.getMessage());
            return null;
        }
    }

    /**
     * 获取 Hash 中的值（指定类型）
     */
    @SuppressWarnings("unchecked")
    public static <T> T hGet(String key, String hashKey, Class<T> clazz) {
        Object value = hGet(key, hashKey);
        if (value == null) {
            return null;
        }
        if (clazz.isInstance(value)) {
            return (T) value;
        }
        return null;
    }

    /**
     * 设置 Hash 值
     *
     * @param key     键
     * @param hashKey Hash键
     * @param value   值
     */
    public static void hSet(String key, String hashKey, Object value) {
        try {
            getRedisTemplate().opsForHash().put(key, hashKey, value);
        } catch (Exception e) {
            log.error("设置Hash失败: key={}, hashKey={}, error={}", key, hashKey, e.getMessage());
        }
    }

    /**
     * 批量设置 Hash 值
     *
     * @param key 键
     * @param map 值集合
     */
    public static void hSetAll(String key, Map<String, Object> map) {
        try {
            getRedisTemplate().opsForHash().putAll(key, map);
        } catch (Exception e) {
            log.error("批量设置Hash失败: key={}, error={}", key, e.getMessage());
        }
    }

    /**
     * 获取所有 Hash 值
     *
     * @param key 键
     * @return Hash值集合
     */
    public static Map<Object, Object> hGetAll(String key) {
        try {
            return getRedisTemplate().opsForHash().entries(key);
        } catch (Exception e) {
            log.error("获取所有Hash失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 删除 Hash 值
     *
     * @param key      键
     * @param hashKeys Hash键集合
     * @return 删除的数量
     */
    public static long hDelete(String key, Object... hashKeys) {
        try {
            Long count = getRedisTemplate().opsForHash().delete(key, hashKeys);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("删除Hash失败: key={}, hashKeys={}, error={}", key, hashKeys, e.getMessage());
            return 0;
        }
    }

    /**
     * 判断 Hash 中是否存在指定键
     *
     * @param key     键
     * @param hashKey Hash键
     * @return true=存在, false=不存在
     */
    public static boolean hHasKey(String key, String hashKey) {
        try {
            Boolean result = getRedisTemplate().opsForHash().hasKey(key, hashKey);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("判断Hash键是否存在失败: key={}, hashKey={}, error={}", key, hashKey, e.getMessage());
            return false;
        }
    }

    /**
     * Hash 值递增
     *
     * @param key     键
     * @param hashKey Hash键
     * @param delta   增量
     * @return 递增后的值
     */
    public static long hIncrement(String key, String hashKey, long delta) {
        try {
            Long result = getRedisTemplate().opsForHash().increment(key, hashKey, delta);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("Hash值递增失败: key={}, hashKey={}, delta={}, error={}", key, hashKey, delta, e.getMessage());
            return 0;
        }
    }

    // ============================= List 操作 =============================

    /**
     * 获取列表指定范围的元素
     *
     * @param key   键
     * @param start 起始位置
     * @param end   结束位置
     * @return 元素列表
     */
    @SuppressWarnings("unchecked")
    public static <T> List<T> lRange(String key, long start, long end) {
        try {
            return (List<T>) getRedisTemplate().opsForList().range(key, start, end);
        } catch (Exception e) {
            log.error("获取List范围失败: key={}, start={}, end={}, error={}", key, start, end, e.getMessage());
            return null;
        }
    }

    /**
     * 获取列表所有元素
     */
    public static <T> List<T> lAll(String key) {
        return lRange(key, 0, -1);
    }

    /**
     * 获取列表长度
     *
     * @param key 键
     * @return 列表长度
     */
    public static long lSize(String key) {
        try {
            Long size = getRedisTemplate().opsForList().size(key);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("获取List长度失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 列表左侧推入
     *
     * @param key   键
     * @param value 值
     * @return 推入后的列表长度
     */
    public static long lLeftPush(String key, Object value) {
        try {
            Long size = getRedisTemplate().opsForList().leftPush(key, value);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("List左侧推入失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 列表左侧批量推入
     *
     * @param key    键
     * @param values 值集合
     * @return 推入后的列表长度
     */
    public static long lLeftPushAll(String key, Collection<Object> values) {
        try {
            Long size = getRedisTemplate().opsForList().leftPushAll(key, values);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("List左侧批量推入失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 列表右侧推入
     *
     * @param key   键
     * @param value 值
     * @return 推入后的列表长度
     */
    public static long lRightPush(String key, Object value) {
        try {
            Long size = getRedisTemplate().opsForList().rightPush(key, value);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("List右侧推入失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 列表右侧批量推入
     *
     * @param key    键
     * @param values 值集合
     * @return 推入后的列表长度
     */
    public static long lRightPushAll(String key, Collection<Object> values) {
        try {
            Long size = getRedisTemplate().opsForList().rightPushAll(key, values);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("List右侧批量推入失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 列表左侧弹出
     *
     * @param key 键
     * @return 弹出的值
     */
    @SuppressWarnings("unchecked")
    public static <T> T lLeftPop(String key) {
        try {
            return (T) getRedisTemplate().opsForList().leftPop(key);
        } catch (Exception e) {
            log.error("List左侧弹出失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 列表右侧弹出
     *
     * @param key 键
     * @return 弹出的值
     */
    @SuppressWarnings("unchecked")
    public static <T> T lRightPop(String key) {
        try {
            return (T) getRedisTemplate().opsForList().rightPop(key);
        } catch (Exception e) {
            log.error("List右侧弹出失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 获取列表指定索引的元素
     *
     * @param key   键
     * @param index 索引
     * @return 元素值
     */
    @SuppressWarnings("unchecked")
    public static <T> T lIndex(String key, long index) {
        try {
            return (T) getRedisTemplate().opsForList().index(key, index);
        } catch (Exception e) {
            log.error("获取List索引元素失败: key={}, index={}, error={}", key, index, e.getMessage());
            return null;
        }
    }

    /**
     * 设置列表指定索引的值
     *
     * @param key   键
     * @param index 索引
     * @param value 值
     */
    public static void lSet(String key, long index, Object value) {
        try {
            getRedisTemplate().opsForList().set(key, index, value);
        } catch (Exception e) {
            log.error("设置List索引元素失败: key={}, index={}, error={}", key, index, e.getMessage());
        }
    }

    /**
     * 删除列表中指定值的元素
     *
     * @param key   键
     * @param count 删除数量：>0从前往后删，<0从后往前删，=0删除全部
     * @param value 值
     * @return 删除的数量
     */
    public static long lRemove(String key, long count, Object value) {
        try {
            Long result = getRedisTemplate().opsForList().remove(key, count, value);
            return result != null ? result : 0;
        } catch (Exception e) {
            log.error("删除List元素失败: key={}, count={}, error={}", key, count, e.getMessage());
            return 0;
        }
    }

    /**
     * 裁剪列表
     *
     * @param key   键
     * @param start 起始位置
     * @param end   结束位置
     */
    public static void lTrim(String key, long start, long end) {
        try {
            getRedisTemplate().opsForList().trim(key, start, end);
        } catch (Exception e) {
            log.error("裁剪List失败: key={}, start={}, end={}, error={}", key, start, end, e.getMessage());
        }
    }

    // ============================= Set 操作 =============================

    /**
     * 向 Set 中添加元素
     *
     * @param key    键
     * @param values 值集合
     * @return 添加的数量
     */
    public static long sAdd(String key, Object... values) {
        try {
            Long count = getRedisTemplate().opsForSet().add(key, values);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Set添加失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 获取 Set 所有元素
     *
     * @param key 键
     * @return 元素集合
     */
    @SuppressWarnings("unchecked")
    public static <T> Set<T> sMembers(String key) {
        try {
            return (Set<T>) getRedisTemplate().opsForSet().members(key);
        } catch (Exception e) {
            log.error("获取Set成员失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 获取 Set 长度
     *
     * @param key 键
     * @return Set 长度
     */
    public static long sSize(String key) {
        try {
            Long size = getRedisTemplate().opsForSet().size(key);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("获取Set长度失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 判断 Set 中是否包含元素
     *
     * @param key   键
     * @param value 值
     * @return true=包含, false=不包含
     */
    public static boolean sIsMember(String key, Object value) {
        try {
            Boolean result = getRedisTemplate().opsForSet().isMember(key, value);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("判断Set成员失败: key={}, error={}", key, e.getMessage());
            return false;
        }
    }

    /**
     * 从 Set 中移除元素
     *
     * @param key    键
     * @param values 值集合
     * @return 移除的数量
     */
    public static long sRemove(String key, Object... values) {
        try {
            Long count = getRedisTemplate().opsForSet().remove(key, values);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("Set移除失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 随机获取 Set 中一个元素
     *
     * @param key 键
     * @return 元素值
     */
    @SuppressWarnings("unchecked")
    public static <T> T sRandomMember(String key) {
        try {
            return (T) getRedisTemplate().opsForSet().randomMember(key);
        } catch (Exception e) {
            log.error("Set随机获取成员失败: key={}, error={}", key, e.getMessage());
            return null;
        }
    }

    /**
     * 随机获取 Set 中指定数量的元素
     *
     * @param key   键
     * @param count 数量
     * @return 元素列表
     */
    @SuppressWarnings("unchecked")
    public static <T> List<T> sRandomMembers(String key, long count) {
        try {
            return (List<T>) getRedisTemplate().opsForSet().randomMembers(key, count);
        } catch (Exception e) {
            log.error("Set随机获取成员失败: key={}, count={}, error={}", key, count, e.getMessage());
            return null;
        }
    }

    // ============================= ZSet 操作 =============================

    /**
     * 向 ZSet 中添加元素
     *
     * @param key   键
     * @param score 分数
     * @param value 值
     * @return 添加的数量
     */
    public static boolean zAdd(String key, double score, Object value) {
        try {
            Boolean result = getRedisTemplate().opsForZSet().add(key, value, score);
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.error("ZSet添加失败: key={}, score={}, error={}", key, score, e.getMessage());
            return false;
        }
    }

    /**
     * 获取 ZSet 指定范围的元素（按分数升序）
     *
     * @param key   键
     * @param start 起始位置
     * @param end   结束位置
     * @return 元素集合
     */
    @SuppressWarnings("unchecked")
    public static <T> Set<T> zRange(String key, long start, long end) {
        try {
            return (Set<T>) getRedisTemplate().opsForZSet().range(key, start, end);
        } catch (Exception e) {
            log.error("获取ZSet范围失败: key={}, start={}, end={}, error={}", key, start, end, e.getMessage());
            return null;
        }
    }

    /**
     * 获取 ZSet 指定范围的元素（按分数降序）
     *
     * @param key   键
     * @param start 起始位置
     * @param end   结束位置
     * @return 元素集合
     */
    @SuppressWarnings("unchecked")
    public static <T> Set<T> zReverseRange(String key, long start, long end) {
        try {
            return (Set<T>) getRedisTemplate().opsForZSet().reverseRange(key, start, end);
        } catch (Exception e) {
            log.error("获取ZSet降序范围失败: key={}, start={}, end={}, error={}", key, start, end, e.getMessage());
            return null;
        }
    }

    /**
     * 获取 ZSet 指定分数范围的元素
     *
     * @param key 键
     * @param min 最小分数
     * @param max 最大分数
     * @return 元素集合
     */
    @SuppressWarnings("unchecked")
    public static <T> Set<T> zRangeByScore(String key, double min, double max) {
        try {
            return (Set<T>) getRedisTemplate().opsForZSet().rangeByScore(key, min, max);
        } catch (Exception e) {
            log.error("获取ZSet分数范围失败: key={}, min={}, max={}, error={}", key, min, max, e.getMessage());
            return null;
        }
    }

    /**
     * 获取元素在 ZSet 中的分数
     *
     * @param key   键
     * @param value 值
     * @return 分数
     */
    public static double zScore(String key, Object value) {
        try {
            Double score = getRedisTemplate().opsForZSet().score(key, value);
            return score != null ? score : 0;
        } catch (Exception e) {
            log.error("获取ZSet分数失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 获取 ZSet 长度
     *
     * @param key 键
     * @return ZSet 长度
     */
    public static long zSize(String key) {
        try {
            Long size = getRedisTemplate().opsForZSet().size(key);
            return size != null ? size : 0;
        } catch (Exception e) {
            log.error("获取ZSet长度失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 获取 ZSet 指定分数范围内的元素数量
     *
     * @param key 键
     * @param min 最小分数
     * @param max 最大分数
     * @return 元素数量
     */
    public static long zCountByScore(String key, double min, double max) {
        try {
            Long count = getRedisTemplate().opsForZSet().count(key, min, max);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("获取ZSet分数范围数量失败: key={}, min={}, max={}, error={}", key, min, max, e.getMessage());
            return 0;
        }
    }

    /**
     * 获取元素在 ZSet 中的排名（从0开始，按分数升序）
     *
     * @param key   键
     * @param value 值
     * @return 排名，不存在返回-1
     */
    public static long zRank(String key, Object value) {
        try {
            Long rank = getRedisTemplate().opsForZSet().rank(key, value);
            return rank != null ? rank : -1;
        } catch (Exception e) {
            log.error("获取ZSet排名失败: key={}, error={}", key, e.getMessage());
            return -1;
        }
    }

    /**
     * 获取元素在 ZSet 中的排名（从0开始，按分数降序）
     *
     * @param key   键
     * @param value 值
     * @return 排名，不存在返回-1
     */
    public static long zReverseRank(String key, Object value) {
        try {
            Long rank = getRedisTemplate().opsForZSet().reverseRank(key, value);
            return rank != null ? rank : -1;
        } catch (Exception e) {
            log.error("获取ZSet降序排名失败: key={}, error={}", key, e.getMessage());
            return -1;
        }
    }

    /**
     * 从 ZSet 中移除元素
     *
     * @param key    键
     * @param values 值集合
     * @return 移除的数量
     */
    public static long zRemove(String key, Object... values) {
        try {
            Long count = getRedisTemplate().opsForZSet().remove(key, values);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("ZSet移除失败: key={}, error={}", key, e.getMessage());
            return 0;
        }
    }

    /**
     * 增加 ZSet 中元素的分数
     *
     * @param key   键
     * @param delta 增量
     * @param value 值
     * @return 新的分数
     */
    public static double zIncrementScore(String key, double delta, Object value) {
        try {
            Double newScore = getRedisTemplate().opsForZSet().incrementScore(key, value, delta);
            return newScore != null ? newScore : 0;
        } catch (Exception e) {
            log.error("ZSet增加分数失败: key={}, delta={}, error={}", key, delta, e.getMessage());
            return 0;
        }
    }

    /**
     * 移除 ZSet 指定排名范围的元素
     *
     * @param key   键
     * @param start 起始排名
     * @param end   结束排名
     * @return 移除的数量
     */
    public static long zRemoveRange(String key, long start, long end) {
        try {
            Long count = getRedisTemplate().opsForZSet().removeRange(key, start, end);
            return count != null ? count : 0;
        } catch (Exception e) {
            log.error("ZSet移除排名范围失败: key={}, start={}, end={}, error={}", key, start, end, e.getMessage());
            return 0;
        }
    }
}
