package com.jf.soulartisan.service;

import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.admin.service.ConcurrencyLimitService;
import com.jf.soulartisan.entity.ImageGenerationTask;
import com.jf.soulartisan.mapper.ImageGenerationTaskMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
public class ImageTaskPollingService {

    private final AtomicBoolean running = new AtomicBoolean(false);
    @Autowired
    private ImageGenerationTaskMapper imageGenerationTaskMapper;
    @Autowired
    private NanoBananaService nanoBananaService;
    @Autowired
    private CosService cosService;
    @Autowired
    private ConcurrencyLimitService concurrencyLimitService;
    @Value("${image-task.poll-interval:10}")
    private int pollInterval;
    @Value("${image-task.max-attempts:60}")
    private int maxAttempts;

    /**
     * 启动轮询任务（按需执行，处理完自动停止）
     */
    @Async("imageTaskExecutor")
    public void startPolling() {
        if (!running.compareAndSet(false, true)) {
            log.debug("图片任务轮询服务已经在运行中，跳过本次启动");
            return;
        }

        log.info("========================================");
        log.info("图片任务轮询服务已启动");
        log.info("========================================");
        log.info("启动时间: {}", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        log.info("轮询间隔: {} 秒", pollInterval);
        log.info("最大尝试次数: {}", maxAttempts);
        log.info("----------------------------------------");

        int processedCount = 0;

        try {
            while (true) {
                // 查询所有待处理和处理中的任务
                List<ImageGenerationTask> tasks = findPendingTasks();

                if (tasks.isEmpty()) {
                    // 没有待处理任务，停止轮询
                    log.info("[{}] 没有待处理任务，轮询服务自动停止", getCurrentTime());
                    break;
                }

                log.info("[{}] 发现 {} 个待处理任务", getCurrentTime(), tasks.size());

                // 处理每个任务
                for (ImageGenerationTask task : tasks) {
                    try {
                        log.info("[{}] 开始处理任务 #{} (task_id: {})", getCurrentTime(), task.getId(), task.getTaskId());
                        pollTask(task);
                        processedCount++;
                        log.info("  └─ 累计处理: {} 个任务", processedCount);
                    } catch (Exception e) {
                        log.error("  └─ 处理任务 #{} 异常: {}", task.getId(), e.getMessage(), e);
                    }
                }

                // 处理完一批任务后，短暂等待再次检查
                Thread.sleep(1000);
            }

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("轮询服务被中断");
        } catch (Exception e) {
            log.error("[{}] 轮询异常: {}", getCurrentTime(), e.getMessage(), e);
        } finally {
            running.set(false);
            log.info("图片任务轮询服务已停止，总共处理 {} 个任务", processedCount);
        }
    }


    /**
     * 轮询单个任务直到完成或失败
     */
    private void pollTask(ImageGenerationTask task) {
        int attempt = 0;

        while (attempt < maxAttempts) {
            attempt++;

            try {
                JSONObject response = nanoBananaService.queryTaskStatus(task.getSiteId(), task.getTaskId());

                if (response == null) {
                    log.warn("  [{}] ⚠ 第 {} 次查询失败，等待 {} 秒...", getCurrentTime(), attempt, pollInterval);
                    Thread.sleep(pollInterval * 1000L);
                    continue;
                }

                if (nanoBananaService.isTaskCompleted(response)) {
                    String thirdPartyUrl = nanoBananaService.extractResultUrl(response);

                    if (thirdPartyUrl != null) {
                        log.info("  [{}] ✓ 第三方任务完成: {}", getCurrentTime(), thirdPartyUrl);

                        // 下载图片并上传到COS（使用任务关联的站点ID）
                        String cosUrl = downloadAndUploadToCos(task.getSiteId(), thirdPartyUrl);

                        if (cosUrl != null) {
                            // 上传成功，保存COS的完整URL
                            task.setStatus(ImageGenerationTask.Status.COMPLETED);
                            task.setResultUrl(cosUrl);
                            task.setCompletedAt(LocalDateTime.now());
                            imageGenerationTaskMapper.updateById(task);

                            // 释放并发槽位
                            concurrencyLimitService.releaseImageSlot(task.getUserId());

                            log.info("  [{}] ✓ 任务完成，图片已保存到COS: {}", getCurrentTime(), cosUrl);
                            return;
                        } else {
                            // 上传失败
                            task.setStatus(ImageGenerationTask.Status.FAILED);
                            task.setErrorMessage("图片上传到COS失败");
                            task.setCompletedAt(LocalDateTime.now());
                            imageGenerationTaskMapper.updateById(task);

                            // 释放并发槽位
                            concurrencyLimitService.releaseImageSlot(task.getUserId());

                            log.error("  [{}] ✗ 任务失败: 图片上传到COS失败", getCurrentTime());
                            return;
                        }
                    } else {
                        task.setStatus(ImageGenerationTask.Status.FAILED);
                        task.setErrorMessage("无法获取结果图片URL");
                        task.setCompletedAt(LocalDateTime.now());
                        imageGenerationTaskMapper.updateById(task);

                        // 释放并发槽位
                        concurrencyLimitService.releaseImageSlot(task.getUserId());

                        log.warn("  [{}] ✗ 任务失败: 无法获取结果URL", getCurrentTime());
                        return;
                    }
                }

                if (nanoBananaService.isTaskFailed(response)) {
                    String errorMessage = nanoBananaService.extractErrorMessage(response);
                    task.setStatus(ImageGenerationTask.Status.FAILED);
                    task.setErrorMessage(errorMessage);
                    task.setCompletedAt(LocalDateTime.now());
                    imageGenerationTaskMapper.updateById(task);

                    // 释放并发槽位
                    concurrencyLimitService.releaseImageSlot(task.getUserId());

                    log.error("  [{}] ✗ 任务失败: {}", getCurrentTime(), errorMessage);
                    return;
                }

                if (!ImageGenerationTask.Status.PROCESSING.equals(task.getStatus())) {
                    task.setStatus(ImageGenerationTask.Status.PROCESSING);
                    imageGenerationTaskMapper.updateById(task);
                }

                log.info("  [{}] ⏳ 第 {} 次检查，任务处理中，等待 {} 秒...", getCurrentTime(), attempt, pollInterval);
                Thread.sleep(pollInterval * 1000L);

            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                log.error("  [{}] ✗ 任务处理被中断", getCurrentTime());
                return;
            } catch (Exception e) {
                log.error("  [{}] ✗ 第 {} 次处理异常: {}", getCurrentTime(), attempt, e.getMessage());
                try {
                    Thread.sleep(pollInterval * 1000L);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    return;
                }
            }
        }

        task.setStatus(ImageGenerationTask.Status.FAILED);
        task.setErrorMessage("超过最大尝试次数（" + maxAttempts + "次）");
        task.setCompletedAt(LocalDateTime.now());
        imageGenerationTaskMapper.updateById(task);

        // 释放并发槽位
        concurrencyLimitService.releaseImageSlot(task.getUserId());

        log.error("  [{}] ✗ 超过最大尝试次数，标记为失败", getCurrentTime());
    }

    /**
     * 查询待处理的任务
     */
    private List<ImageGenerationTask> findPendingTasks() {
        LambdaQueryWrapper<ImageGenerationTask> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.in(ImageGenerationTask::getStatus,
                ImageGenerationTask.Status.PENDING,
                ImageGenerationTask.Status.PROCESSING);
        queryWrapper.orderByAsc(ImageGenerationTask::getCreatedAt);
        queryWrapper.last("LIMIT 10"); // 每次最多处理10个任务

        return imageGenerationTaskMapper.selectList(queryWrapper);
    }

    private String getCurrentTime() {
        return LocalDateTime.now().format(DateTimeFormatter.ofPattern("HH:mm:ss"));
    }

    public boolean isRunning() {
        return running.get();
    }

    /**
     * 下载图片并上传到COS
     *
     * @param siteId   站点ID
     * @param imageUrl 第三方图片URL
     * @return COS中的图片完整URL
     */
    private String downloadAndUploadToCos(Long siteId, String imageUrl) {
        InputStream inputStream = null;
        HttpURLConnection connection = null;

        try {
            log.info("  └─ 开始下载图片: {}", imageUrl);

            // 下载图片
            URL url = new URL(imageUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(30000);
            connection.setRequestMethod("GET");
            connection.connect();

            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                log.error("  └─ 下载图片失败，HTTP状态码: {}", responseCode);
                return null;
            }

            inputStream = connection.getInputStream();

            // 读取图片数据到字节数组
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            byte[] imageBytes = outputStream.toByteArray();

            log.info("  └─ 图片下载成功，大小: {} KB", imageBytes.length / 1024);

            // 从URL中提取文件扩展名
            String fileName = extractFileName(imageUrl);

            // 上传到COS（使用站点ID）
            log.info("  └─ 开始上传图片到COS...");
            String cosUrl = cosService.uploadFile(siteId, imageBytes, fileName);
            log.info("  └─ 图片上传成功: {}", cosUrl);

            return cosUrl;

        } catch (Exception e) {
            log.error("  └─ 下载并上传图片失败: {}", e.getMessage(), e);
            return null;
        } finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
                if (connection != null) {
                    connection.disconnect();
                }
            } catch (Exception e) {
                log.error("  └─ 关闭连接异常: {}", e.getMessage());
            }
        }
    }

    /**
     * 从URL中提取文件名
     *
     * @param imageUrl 图片URL
     * @return 文件名
     */
    private String extractFileName(String imageUrl) {
        try {
            // 从URL中提取文件名
            String path = new URL(imageUrl).getPath();
            String fileName = path.substring(path.lastIndexOf('/') + 1);

            // 如果文件名为空或没有扩展名，使用默认值
            if (fileName.isEmpty() || !fileName.contains(".")) {
                return "image.png";
            }

            return fileName;
        } catch (Exception e) {
            log.warn("  └─ 提取文件名失败，使用默认值: image.png");
            return "image.png";
        }
    }
}
