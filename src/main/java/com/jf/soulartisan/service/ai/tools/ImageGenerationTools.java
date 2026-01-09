package com.jf.soulartisan.service.ai.tools;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.entity.ImageGenerationTask;
import com.jf.soulartisan.mapper.ImageGenerationTaskMapper;
import com.jf.soulartisan.service.CosService;
import com.jf.soulartisan.service.NanoBananaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 图片生成相关的Spring AI Tools
 * 用于Agent调用图片生成、查询任务状态等功能
 *
 * 注意：siteId和userId通过AgentContext自动获取，不作为工具参数
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ImageGenerationTools {

    private final NanoBananaService nanoBananaService;
    private final ImageGenerationTaskMapper imageGenerationTaskMapper;
    private final CosService cosService;
    private final AgentContext agentContext;

    /**
     * 文生图 - 根据文本描述生成图片
     *
     * @param prompt      图片描述提示词（必填）
     * @param model       模型名称（可选，默认 gemini-3-pro-image-preview）
     * @param aspectRatio 图片比例（可选，如 16:9, 1:1, 4:3 等，默认 auto）
     * @param imageSize   图片尺寸（可选，仅 gemini-3-pro-image-preview 支持）
     * @return 任务创��结��，包含任务ID
     */
    @Tool(description = "文生图工具：根据文本描述生成图片。返回任务ID，可通过queryImageTask查询结果。")
    public String textToImage(
            @ToolParam(description = "图片描述提示词，描述你想要生成的图片内容") String prompt,
            @ToolParam(description = "模型名称，可选，默认gemini-3-pro-image-preview", required = false) String model,
            @ToolParam(description = "图片比例，如16:9、1:1、4:3等，默认auto", required = false) String aspectRatio,
            @ToolParam(description = "图片尺寸，可选", required = false) String imageSize
    ) {
        Long siteId = agentContext.getSiteId();
        Long userId = agentContext.getUserId();
        log.info("[TextToImage] 开始文生图任务: siteId={}, userId={}, prompt={}", siteId, userId, prompt);

        try {
            JSONObject response = nanoBananaService.textToImage(
                    siteId,
                    prompt,
                    model,
                    aspectRatio,
                    imageSize
            );

            if (response == null) {
                return buildErrorResult("调用图像生成服务失败");
            }

            String taskId = nanoBananaService.extractTaskId(response);
            if (StrUtil.isBlank(taskId)) {
                return buildErrorResult("获取任务ID失败");
            }

            // 保存任务记录
            ImageGenerationTask task = new ImageGenerationTask();
            task.setUserId(userId);
            task.setSiteId(siteId);
            task.setTaskId(taskId);
            task.setType(ImageGenerationTask.Type.TEXT2IMAGE);
            task.setModel(StrUtil.isBlank(model) ? "gemini-3-pro-image-preview" : model);
            task.setPrompt(prompt);
            task.setAspectRatio(StrUtil.isBlank(aspectRatio) ? "auto" : aspectRatio);
            task.setImageSize(imageSize);
            task.setStatus(ImageGenerationTask.Status.PENDING);

            imageGenerationTaskMapper.insert(task);

            log.info("[TextToImage] 任务创建成功: id={}, taskId={}", task.getId(), taskId);

            return buildSuccessResult("任务创建成功", task.getId(), taskId);

        } catch (Exception e) {
            log.error("[TextToImage] 创建任务失败: {}", e.getMessage(), e);
            return buildErrorResult("创建任务失败: " + e.getMessage());
        }
    }

    /**
     * 图生图 - 基于参考图片和文本描述生成新图片
     *
     * @param prompt      图片描述提示词（必填）
     * @param imageUrls   参考图片URL列表（必填）
     * @param model       模型名称（可选）
     * @param aspectRatio 图片比例（可选）
     * @param imageSize   图片尺寸（可选）
     * @return 任务创建结果
     */
    @Tool(description = "图生图工具：基于参考图片和文本描述生成新图片。返回任务ID，可通过queryImageTask查询结果。")
    public String imageToImage(
            @ToolParam(description = "图片描述提示词，描述你想要生成的图片内容") String prompt,
            @ToolParam(description = "参考图片URL列表") List<String> imageUrls,
            @ToolParam(description = "模型名称，可选", required = false) String model,
            @ToolParam(description = "图片比例，如16:9、1:1、4:3等，默认auto", required = false) String aspectRatio,
            @ToolParam(description = "图片尺寸，可选", required = false) String imageSize
    ) {
        Long siteId = agentContext.getSiteId();
        Long userId = agentContext.getUserId();
        log.info("[ImageToImage] 开始图生图任务: siteId={}, userId={}, prompt={}, imageUrls={}",
                siteId, userId, prompt, imageUrls);

        if (imageUrls == null || imageUrls.isEmpty()) {
            return buildErrorResult("参考图片URL列表不能为空");
        }

        try {
            JSONObject response = nanoBananaService.imageToImage(
                    siteId,
                    prompt,
                    imageUrls,
                    model,
                    aspectRatio,
                    imageSize
            );

            if (response == null) {
                return buildErrorResult("调用图像生成服务失败");
            }

            String taskId = nanoBananaService.extractTaskId(response);
            if (StrUtil.isBlank(taskId)) {
                return buildErrorResult("获取任务ID失败");
            }

            // 保存任务记录
            ImageGenerationTask task = new ImageGenerationTask();
            task.setUserId(userId);
            task.setSiteId(siteId);
            task.setTaskId(taskId);
            task.setType(ImageGenerationTask.Type.IMAGE2IMAGE);
            task.setModel(StrUtil.isBlank(model) ? "gemini-3-pro-image-preview" : model);
            task.setPrompt(prompt);
            task.setImageUrls(imageUrls);
            task.setAspectRatio(StrUtil.isBlank(aspectRatio) ? "auto" : aspectRatio);
            task.setImageSize(imageSize);
            task.setStatus(ImageGenerationTask.Status.PENDING);

            imageGenerationTaskMapper.insert(task);

            log.info("[ImageToImage] 任务创建成功: id={}, taskId={}", task.getId(), taskId);

            return buildSuccessResult("任务创建成功", task.getId(), taskId);

        } catch (Exception e) {
            log.error("[ImageToImage] 创建任务失败: {}", e.getMessage(), e);
            return buildErrorResult("创建任务失败: " + e.getMessage());
        }
    }

    /**
     * 查询图片生成任务状态
     *
     * @param taskId         任务数据库ID（必填，非第三方taskId）
     * @param waitMode       等待模式：poll=轮询等待直到完成，once=只查询一次
     * @param maxWaitSeconds 最大等待时间（秒），仅在waitMode=poll时有效，默认120秒
     * @return 任务状态和结果
     */
    @Tool(description = "查询图片生成任务状态。支持轮询等待模式，直到任务完成或失败。返回任务状态、结果URL等信息。")
    public String queryImageTask(
            @ToolParam(description = "任务数据库ID（非第三方taskId）") Long taskId,
            @ToolParam(description = "等待模式：poll=轮询等待直到完成，once=只查询一次，默认once", required = false) String waitMode,
            @ToolParam(description = "最大等待时间（秒），仅poll模式有效，默认120", required = false) Integer maxWaitSeconds
    ) {
        log.info("[QueryImageTask] 查询任务: taskId={}, waitMode={}, maxWaitSeconds={}",
                taskId, waitMode, maxWaitSeconds);

        if (taskId == null) {
            return buildErrorResult("任务ID不能为空");
        }

        ImageGenerationTask task = imageGenerationTaskMapper.selectById(taskId);
        if (task == null) {
            return buildErrorResult("任务不存在");
        }

        // 如果任务已完成或失败，直接返回
        if (ImageGenerationTask.Status.COMPLETED.equals(task.getStatus()) ||
                ImageGenerationTask.Status.FAILED.equals(task.getStatus())) {
            return buildTaskResult(task);
        }

        // 如果是poll模式，轮询等待
        if ("poll".equalsIgnoreCase(waitMode)) {
            int maxWait = maxWaitSeconds != null && maxWaitSeconds > 0 ? maxWaitSeconds : 120;
            int pollInterval = 5; // 每5秒查询一次
            int maxAttempts = maxWait / pollInterval;

            for (int i = 0; i < maxAttempts; i++) {
                try {
                    // 查询第三方任务状态
                    JSONObject response = nanoBananaService.queryTaskStatus(task.getSiteId(), task.getTaskId());

                    if (nanoBananaService.isTaskCompleted(response)) {
                        String thirdPartyUrl = nanoBananaService.extractResultUrl(response);
                        if (thirdPartyUrl != null) {
                            // 下载并上传到COS
                            String cosUrl = downloadAndUploadToCos(task.getSiteId(), thirdPartyUrl);
                            if (cosUrl != null) {
                                task.setStatus(ImageGenerationTask.Status.COMPLETED);
                                task.setResultUrl(cosUrl);
                                task.setCompletedAt(LocalDateTime.now());
                            } else {
                                task.setStatus(ImageGenerationTask.Status.FAILED);
                                task.setErrorMessage("图片上传到COS失败");
                                task.setCompletedAt(LocalDateTime.now());
                            }
                        } else {
                            task.setStatus(ImageGenerationTask.Status.FAILED);
                            task.setErrorMessage("无法获取结果图片URL");
                            task.setCompletedAt(LocalDateTime.now());
                        }
                        imageGenerationTaskMapper.updateById(task);
                        return buildTaskResult(task);
                    }

                    if (nanoBananaService.isTaskFailed(response)) {
                        String errorMessage = nanoBananaService.extractErrorMessage(response);
                        task.setStatus(ImageGenerationTask.Status.FAILED);
                        task.setErrorMessage(errorMessage);
                        task.setCompletedAt(LocalDateTime.now());
                        imageGenerationTaskMapper.updateById(task);
                        return buildTaskResult(task);
                    }

                    // 更新为处理中状态
                    if (!ImageGenerationTask.Status.PROCESSING.equals(task.getStatus())) {
                        task.setStatus(ImageGenerationTask.Status.PROCESSING);
                        imageGenerationTaskMapper.updateById(task);
                    }

                    log.info("[QueryImageTask] 任务处理中，等待{}秒后重试... ({}/%d)", pollInterval, i + 1, maxAttempts);
                    Thread.sleep(pollInterval * 1000L);

                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return buildErrorResult("任务查询被中断");
                } catch (Exception e) {
                    log.error("[QueryImageTask] 查询异常: {}", e.getMessage());
                    // 继续尝试
                }
            }

            // 超时
            return buildErrorResult("任务查询超时，请稍后再试");
        }

        // once模式，只查询一次数据库状态
        return buildTaskResult(task);
    }

    /**
     * 根据用户ID查询任务列表
     */
    @Tool(description = "查询当前用户的图片生成任务列表，可按状态和类型过滤")
    public String listImageTasks(
            @ToolParam(description = "任务状态过滤：pending/processing/completed/failed，为空则查询全部", required = false) String status,
            @ToolParam(description = "任务类型过滤：text2image/image2image，为空则查询全部", required = false) String type,
            @ToolParam(description = "返回数量限制，默认10", required = false) Integer limit
    ) {
        Long userId = agentContext.getUserId();
        log.info("[ListImageTasks] 查询任务列表: userId={}, status={}, type={}", userId, status, type);

        if (userId == null) {
            return buildErrorResult("用户ID不能为��");
        }

        LambdaQueryWrapper<ImageGenerationTask> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(ImageGenerationTask::getUserId, userId);

        if (StrUtil.isNotBlank(status)) {
            queryWrapper.eq(ImageGenerationTask::getStatus, status);
        }

        if (StrUtil.isNotBlank(type)) {
            queryWrapper.eq(ImageGenerationTask::getType, type);
        }

        queryWrapper.orderByDesc(ImageGenerationTask::getCreatedAt);
        queryWrapper.last("LIMIT " + (limit != null && limit > 0 ? limit : 10));

        List<ImageGenerationTask> tasks = imageGenerationTaskMapper.selectList(queryWrapper);

        JSONObject result = new JSONObject();
        result.put("success", true);
        result.put("count", tasks.size());
        result.put("tasks", tasks);

        return result.toJSONString();
    }

    /**
     * 下载图片并上传到COS
     */
    private String downloadAndUploadToCos(Long siteId, String imageUrl) {
        HttpURLConnection connection = null;
        InputStream inputStream = null;

        try {
            URL url = new URL(imageUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(10000);
            connection.setReadTimeout(30000);
            connection.setRequestMethod("GET");
            connection.connect();

            if (connection.getResponseCode() != HttpURLConnection.HTTP_OK) {
                log.error("[DownloadAndUpload] 下载图片失败，HTTP状态码: {}", connection.getResponseCode());
                return null;
            }

            inputStream = connection.getInputStream();

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            byte[] imageBytes = outputStream.toByteArray();

            String fileName = extractFileName(imageUrl);
            return cosService.uploadFile(siteId, imageBytes, fileName);

        } catch (Exception e) {
            log.error("[DownloadAndUpload] 下载并上传图片失败: {}", e.getMessage(), e);
            return null;
        } finally {
            try {
                if (inputStream != null) inputStream.close();
                if (connection != null) connection.disconnect();
            } catch (Exception ignored) {
            }
        }
    }

    private String extractFileName(String imageUrl) {
        try {
            String path = new URL(imageUrl).getPath();
            String fileName = path.substring(path.lastIndexOf('/') + 1);
            if (fileName.isEmpty() || !fileName.contains(".")) {
                return "image.png";
            }
            return fileName;
        } catch (Exception e) {
            return "image.png";
        }
    }

    private String buildSuccessResult(String message, Long id, String taskId) {
        JSONObject result = new JSONObject();
        result.put("success", true);
        result.put("message", message);
        result.put("id", id);
        result.put("taskId", taskId);
        return result.toJSONString();
    }

    private String buildErrorResult(String message) {
        JSONObject result = new JSONObject();
        result.put("success", false);
        result.put("message", message);
        return result.toJSONString();
    }

    private String buildTaskResult(ImageGenerationTask task) {
        JSONObject result = new JSONObject();
        result.put("success", true);
        result.put("id", task.getId());
        result.put("taskId", task.getTaskId());
        result.put("type", task.getType());
        result.put("status", task.getStatus());
        result.put("resultUrl", task.getResultUrl());
        result.put("errorMessage", task.getErrorMessage());
        result.put("prompt", task.getPrompt());
        result.put("createdAt", task.getCreatedAt() != null ? task.getCreatedAt().toString() : null);
        result.put("completedAt", task.getCompletedAt() != null ? task.getCompletedAt().toString() : null);
        return result.toJSONString();
    }
}
