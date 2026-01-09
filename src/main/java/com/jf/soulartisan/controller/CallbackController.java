package com.jf.soulartisan.controller;

import cn.dev33.satoken.annotation.SaIgnore;
import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.admin.service.ConcurrencyLimitService;
import com.jf.soulartisan.common.dto.CharacterCallbackRequest;
import com.jf.soulartisan.common.dto.VideoCallbackRequest;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.entity.Character;
import com.jf.soulartisan.entity.VideoGenerationTask;
import com.jf.soulartisan.entity.VideoResource;
import com.jf.soulartisan.mapper.CharacterMapper;
import com.jf.soulartisan.mapper.VideoGenerationTaskMapper;
import com.jf.soulartisan.mapper.VideoResourceMapper;
import com.jf.soulartisan.service.CosService;
import com.jf.soulartisan.service.VideoTaskCacheService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * 回调接口控制器（不需要鉴权）
 */
@Slf4j
@RestController
@RequestMapping("/callback")
@Tag(name = "回调接口（第三方服务调用）")
public class CallbackController {

    @Resource
    private CharacterMapper characterMapper;

    @Resource
    private VideoResourceMapper videoResourceMapper;

    @Resource
    private VideoGenerationTaskMapper videoGenerationTaskMapper;

    @Resource
    private CosService cosService;

    @Resource
    private VideoTaskCacheService videoTaskCacheService;

    @Resource
    private ConcurrencyLimitService concurrencyLimitService;

    @PostMapping("/video")
    @Operation(summary = "视频生成回调接口")
    @SaIgnore
    public Result<?> videoCallback(@RequestBody VideoCallbackRequest request) {
        log.info("收到视频生成回调: id={}, state={}, progress={}",
                request.getId(), request.getState(), request.getProgress());
        log.info("回调参数: {}", JSONObject.toJSONString(request));

        try {
            if (StrUtil.isBlank(request.getId())) {
                log.error("回调参数错误: 缺少任务ID");
                return Result.error("缺少任务ID", 400);
            }

            // 根据 taskId 查询视频生成任务
            VideoGenerationTask task = videoGenerationTaskMapper.selectByTaskId(request.getId());
            if (task == null) {
                log.error("视频任务不存在: task_id={}", request.getId());
                return Result.error("视频任务不存在", 404);
            }

            // 更新任务状态
            if ("succeeded".equals(request.getState())) {
                // 提取视频URL
                String videoUrl = null;
                if (request.getData() != null && request.getData().getVideos() != null
                        && !request.getData().getVideos().isEmpty()) {
                    videoUrl = request.getData().getVideos().get(0).getUrl();
                }

                if (StrUtil.isBlank(videoUrl)) {
                    log.error("回调参数错误: 缺少视频URL");
                    task.setStatus(VideoGenerationTask.Status.ERROR);
                    task.setErrorMessage("回调数据中缺少视频URL");
                    task.setCompletedAt(java.time.LocalDateTime.now());

                    // 先更新Redis缓存
                    videoTaskCacheService.updateTask(task);
                    // 再更新数据库
                    videoGenerationTaskMapper.updateById(task);

                    return Result.error("缺少视频URL", 400);
                }

                // 先更新为处理中状态
                task.setStatus(VideoGenerationTask.Status.RUNNING);
                task.setProgress(request.getProgress() != null ? request.getProgress() : 100);

                // 先更新Redis缓存
                videoTaskCacheService.updateTask(task);
                // 再更新数据库
                videoGenerationTaskMapper.updateById(task);

                log.info("视频生成成功，开始异步下载并上传到COS: task_id={}, url={}",
                        request.getId(), videoUrl);

                // 异步下载并上传视频到COS（传入siteId）
                processVideoAsync(task.getId(), task.getSiteId(), videoUrl);

            } else if ("failed".equals(request.getState())) {
                task.setStatus(VideoGenerationTask.Status.ERROR);
                task.setErrorMessage(StrUtil.isNotBlank(request.getMessage())
                        ? request.getMessage()
                        : "视频生成失败");
                task.setCompletedAt(java.time.LocalDateTime.now());
                log.error("视频生成失败: id={}, task_id={}, error={}",
                        task.getId(), request.getId(), request.getMessage());

                // 释放并发槽位
                concurrencyLimitService.releaseVideoSlot(task.getUserId());

                // 先更新Redis缓存
                videoTaskCacheService.updateTask(task);
                // 再更新数据库

            } else if ("processing".equals(request.getState())) {
                task.setStatus(VideoGenerationTask.Status.RUNNING);
                if (request.getProgress() != null) {
                    task.setProgress(request.getProgress());
                }
                log.info("视频正在处理: id={}, task_id={}, progress={}",
                        task.getId(), request.getId(), request.getProgress());

                // 先更新Redis缓存
                videoTaskCacheService.updateTask(task);
                // 再更新数据库

            } else {
                log.warn("未知的状态: state={}", request.getState());
            }

            // 保存更新到数据库
            int result = videoGenerationTaskMapper.updateById(task);
            if (result <= 0) {
                log.error("更新视频任务状态失败: id={}", task.getId());
                return Result.error("更新状态失败", 500);
            }

            return Result.success(null, "回调处理成功");

        } catch (Exception e) {
            log.error("处理视频生成回调失败: {}", e.getMessage(), e);
            return Result.error("处理回调失败: " + e.getMessage(), 500);
        }
    }

    @PostMapping("/character")
    @Operation(summary = "角色生成回调接口")
    @SaIgnore
    public Result<?> characterCallback(@RequestBody CharacterCallbackRequest request) {
        log.info("收到角色生成回调: id={}, state={}", request.getId(), request.getState());
        log.info("回调参数: {}", JSONObject.toJSONString(request));

        try {
            if (StrUtil.isBlank(request.getId())) {
                log.error("回调参数错误: 缺少任务ID");
                return Result.error("缺少任务ID", 400);
            }

            // 根据generationTaskId查询角色
            Character character = characterMapper.selectByGenerationTaskId(request.getId());
            if (character == null) {
                log.error("角色不存在: generation_task_id={}", request.getId());
                return Result.error("角色不存在", 404);
            }

            // 更新角色状态
            if ("succeeded".equals(request.getState())) {
                character.setStatus(Character.Status.COMPLETED);

                // 保存完整的回调数据
                character.setResultData(request.getData());

                // 从回调数据中提取生成的角色ID并保存
                if (request.getData() != null && request.getData().getCharacters() != null
                    && !request.getData().getCharacters().isEmpty()) {
                    String characterId = request.getData().getCharacters().get(0).getId();
                    character.setCharacterId(characterId);
                    log.info("保存角色ID: generation_task_id={}, character_id={}",
                            request.getId(), characterId);
                }

                character.setCompletedAt(java.time.LocalDateTime.now());
                log.info("角色生成完成: id={}, generation_task_id={}", character.getId(), request.getId());

            } else if ("failed".equals(request.getState())) {
                character.setStatus(Character.Status.FAILED);
                character.setErrorMessage(StrUtil.isNotBlank(request.getMessage())
                    ? request.getMessage()
                    : "角色生成失败");
                log.error("角色生成失败: id={}, generation_task_id={}, error={}",
                        character.getId(), request.getId(), request.getMessage());

            } else if ("processing".equals(request.getState())) {
                character.setStatus(Character.Status.PROCESSING);
                log.info("角色正在处理: id={}, generation_task_id={}", character.getId(), request.getId());

            } else {
                log.warn("未知的状态: state={}", request.getState());
            }

            // 保存更新
            int result = characterMapper.updateById(character);
            if (result <= 0) {
                log.error("更新角色状态失败: id={}", character.getId());
                return Result.error("更新状态失败", 500);
            }

            return Result.success(null, "回调处理成功");

        } catch (Exception e) {
            log.error("处理角色生成回调失败: {}", e.getMessage(), e);
            return Result.error("处理回调失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 异步处理视频：下载并上传到COS
     *
     * @param taskId   数据库任务ID
     * @param siteId   站点ID
     * @param videoUrl 第三方视频URL
     */
    @Async
    public void processVideoAsync(Long taskId, Long siteId, String videoUrl) {
        Long userId = null;
        try {
            // 先获取任务信息以获取userId
            VideoGenerationTask initialTask = videoGenerationTaskMapper.selectById(taskId);
            if (initialTask != null) {
                userId = initialTask.getUserId();
            }

            log.info("开始下载视频: taskId={}, siteId={}, url={}", taskId, siteId, videoUrl);

            // 下载视频
            byte[] videoBytes = downloadVideo(videoUrl);

            if (videoBytes == null || videoBytes.length == 0) {
                log.error("视频下载失败: taskId={}", taskId);
                updateTaskError(taskId, "视频下载失败");
                // 释放并发槽位
                if (userId != null) {
                    concurrencyLimitService.releaseVideoSlot(userId);
                }
                return;
            }

            log.info("视频下载成功，大小: {} MB, taskId={}",
                    videoBytes.length / (1024 * 1024), taskId);

            // 从URL中提取文件名
            String fileName = extractFileName(videoUrl);

            // 上传到COS
            log.info("开始上传视频到COS: taskId={}, siteId={}", taskId, siteId);
            String cosUrl = cosService.uploadFile(siteId, videoBytes, fileName);

            if (StrUtil.isBlank(cosUrl)) {
                log.error("视频上传到COS失败: taskId={}", taskId);
                updateTaskError(taskId, "视频上传到COS失败");
                // 释放并发槽位
                if (userId != null) {
                    concurrencyLimitService.releaseVideoSlot(userId);
                }
                return;
            }

            log.info("视频上传成功: taskId={}, cosUrl={}", taskId, cosUrl);

            // 更新任务状态为成功
            VideoGenerationTask task = videoGenerationTaskMapper.selectById(taskId);
            if (task != null) {
                task.setStatus(VideoGenerationTask.Status.SUCCEEDED);
                task.setResultUrl(cosUrl);
                task.setProgress(100);
                task.setCompletedAt(java.time.LocalDateTime.now());

                // 先更新Redis缓存
                videoTaskCacheService.updateTask(task);
                // 再更新数据库
                videoGenerationTaskMapper.updateById(task);

                // 释放并发槽位
                concurrencyLimitService.releaseVideoSlot(task.getUserId());

                log.info("视频任务完成: id={}, url={}", taskId, cosUrl);

                // 更新关联的 VideoResource 记录
                updateVideoResourceByTaskId(task.getTaskId(), cosUrl);
            }

        } catch (Exception e) {
            log.error("异步处理视频失败: taskId={}, error={}", taskId, e.getMessage(), e);
            updateTaskError(taskId, "处理视频失败: " + e.getMessage());
            // 释放并发槽位
            if (userId != null) {
                concurrencyLimitService.releaseVideoSlot(userId);
            }
        }
    }

    /**
     * 下载视频
     *
     * @param videoUrl 视频URL
     * @return 视频字节数组
     */
    private byte[] downloadVideo(String videoUrl) {
        InputStream inputStream = null;
        HttpURLConnection connection = null;

        try {
            URL url = new URL(videoUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(30000); // 30秒连接超时
            connection.setReadTimeout(300000);   // 5分钟读取超时
            connection.setRequestMethod("GET");
            connection.connect();

            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                log.error("下载视频失败，HTTP状态码: {}", responseCode);
                return null;
            }

            inputStream = connection.getInputStream();
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int bytesRead;
            long totalBytesRead = 0;

            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
                totalBytesRead += bytesRead;

                // 每10MB输出一次进度日志
                if (totalBytesRead % (10 * 1024 * 1024) == 0) {
                    log.info("已下载: {} MB", totalBytesRead / (1024 * 1024));
                }
            }

            return outputStream.toByteArray();

        } catch (Exception e) {
            log.error("下载视频异常: {}", e.getMessage(), e);
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
                log.error("关闭连接异常: {}", e.getMessage());
            }
        }
    }

    /**
     * 从URL中提取文件名
     *
     * @param videoUrl 视频URL
     * @return 文件名
     */
    private String extractFileName(String videoUrl) {
        try {
            String path = new URL(videoUrl).getPath();
            String fileName = path.substring(path.lastIndexOf('/') + 1);

            // 如果文件名为空或没有扩展名，使用默认值
            if (fileName.isEmpty() || !fileName.contains(".")) {
                return "video.mp4";
            }

            // 移除URL参数（如果有）
            int queryIndex = fileName.indexOf('?');
            if (queryIndex > 0) {
                fileName = fileName.substring(0, queryIndex);
            }

            return fileName;
        } catch (Exception e) {
            log.warn("提取文件名失败，使用默认值: video.mp4");
            return "video.mp4";
        }
    }

    /**
     * 更新任务为错误状态
     *
     * @param taskId       任务ID
     * @param errorMessage 错误消息
     */
    private void updateTaskError(Long taskId, String errorMessage) {
        try {
            VideoGenerationTask task = videoGenerationTaskMapper.selectById(taskId);
            if (task != null) {
                task.setStatus(VideoGenerationTask.Status.ERROR);
                task.setErrorMessage(errorMessage);
                task.setCompletedAt(java.time.LocalDateTime.now());

                // 先更新Redis缓存
                videoTaskCacheService.updateTask(task);
                // 再更新数据库
                videoGenerationTaskMapper.updateById(task);

                // 更新关联的 VideoResource 为失败状态
                updateVideoResourceError(task.getTaskId(), errorMessage);
            }
        } catch (Exception e) {
            log.error("更新任务错误状态失败: taskId={}, error={}", taskId, e.getMessage());
        }
    }

    /**
     * 根据视频任务ID更新 VideoResource
     *
     * @param videoTaskId 视频任务ID
     * @param videoUrl    视频URL
     */
    private void updateVideoResourceByTaskId(String videoTaskId, String videoUrl) {
        try {
            if (StrUtil.isBlank(videoTaskId)) {
                return;
            }

            java.util.List<VideoResource> resources = videoResourceMapper.selectByVideoTaskId(videoTaskId);
            if (resources == null || resources.isEmpty()) {
                log.debug("未找到关联的 VideoResource: videoTaskId={}", videoTaskId);
                return;
            }

            for (VideoResource resource : resources) {
                resource.setVideoResultUrl(videoUrl);
                // 如果当前状态是 video_generating，更新为 video_generated（视频生成完成）
                // 后续如果需要角色生成，状态会在角色生成时变为 character_generating，完成后变为 completed
                if (VideoResource.Status.VIDEO_GENERATING.equals(resource.getStatus())) {
                    resource.setStatus(VideoResource.Status.VIDEO_GENERATED);
                }
                videoResourceMapper.updateById(resource);
                log.info("更新 VideoResource 视频URL: id={}, videoTaskId={}, videoUrl={}",
                        resource.getId(), videoTaskId, videoUrl);
            }
        } catch (Exception e) {
            log.error("更新 VideoResource 失败: videoTaskId={}, error={}", videoTaskId, e.getMessage(), e);
        }
    }

    /**
     * 更新 VideoResource 为错误状态
     *
     * @param videoTaskId  视频任务ID
     * @param errorMessage 错误信息
     */
    private void updateVideoResourceError(String videoTaskId, String errorMessage) {
        try {
            if (StrUtil.isBlank(videoTaskId)) {
                return;
            }

            java.util.List<VideoResource> resources = videoResourceMapper.selectByVideoTaskId(videoTaskId);
            if (resources == null || resources.isEmpty()) {
                return;
            }

            for (VideoResource resource : resources) {
                resource.setStatus(VideoResource.Status.FAILED);
                resource.setErrorMessage(errorMessage);
                videoResourceMapper.updateById(resource);
                log.info("更新 VideoResource 为失败状态: id={}, videoTaskId={}", resource.getId(), videoTaskId);
            }
        } catch (Exception e) {
            log.error("更新 VideoResource 错误状态失败: videoTaskId={}, error={}", videoTaskId, e.getMessage(), e);
        }
    }

    /**
     * 视频资源角色生成回调接口
     * 处理 VideoResource 的角色生成回调
     */
    @PostMapping("/video-resource/character")
    @Operation(summary = "视频资源角色生成回调接口")
    @SaIgnore
    public Result<?> videoResourceCharacterCallback(@RequestBody CharacterCallbackRequest request) {
        log.info("收到视频资源角色生成回调: id={}, state={}", request.getId(), request.getState());
        log.info("回调参数: {}", JSONObject.toJSONString(request));

        try {
            if (StrUtil.isBlank(request.getId())) {
                log.error("回调参数错误: 缺少任务ID");
                return Result.error("缺少任务ID", 400);
            }

            // 根据 generationTaskId 查询 VideoResource
            VideoResource resource = videoResourceMapper.selectByGenerationTaskId(request.getId());
            if (resource == null) {
                log.warn("VideoResource 不存在，尝试查询旧版 Character: generation_task_id={}", request.getId());
                // 兼容旧版：如果 VideoResource 不存在，尝试查询 Character
                return characterCallback(request);
            }

            // 更新资源状态
            if ("succeeded".equals(request.getState())) {
                resource.setStatus(VideoResource.Status.COMPLETED);

                // 保存完整的回调数据
                resource.setResultData(request.getData());

                // 从回调数据中提取生成的角色ID
                if (request.getData() != null && request.getData().getCharacters() != null
                        && !request.getData().getCharacters().isEmpty()) {
                    String characterId = request.getData().getCharacters().get(0).getId();
                    resource.setCharacterId(characterId);
                    log.info("保存角色ID: generation_task_id={}, character_id={}",
                            request.getId(), characterId);
                }

                resource.setCompletedAt(java.time.LocalDateTime.now());
                log.info("视频资源角色生成完成: id={}, generation_task_id={}",
                        resource.getId(), request.getId());

            } else if ("failed".equals(request.getState())) {
                resource.setStatus(VideoResource.Status.FAILED);
                resource.setErrorMessage(StrUtil.isNotBlank(request.getMessage())
                        ? request.getMessage()
                        : "角色生成失败");
                log.error("视频资源角色生成失败: id={}, generation_task_id={}, error={}",
                        resource.getId(), request.getId(), request.getMessage());

            } else if ("processing".equals(request.getState())) {
                resource.setStatus(VideoResource.Status.CHARACTER_GENERATING);
                log.info("视频资源角色正在处理: id={}, generation_task_id={}",
                        resource.getId(), request.getId());

            } else {
                log.warn("未知的状态: state={}", request.getState());
            }

            // 保存更新
            int result = videoResourceMapper.updateById(resource);
            if (result <= 0) {
                log.error("更新视频资源状态失败: id={}", resource.getId());
                return Result.error("更新状态失败", 500);
            }

            return Result.success(null, "回调处理成功");

        } catch (Exception e) {
            log.error("处理视频资源角色生成回调失败: {}", e.getMessage(), e);
            return Result.error("处理回调失败: " + e.getMessage(), 500);
        }
    }
}
