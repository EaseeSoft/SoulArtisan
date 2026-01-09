package com.jf.soulartisan.service;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.common.util.HttpClientUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SoraService {

    private final SiteConfigProvider siteConfigProvider;

    /**
     * 创建视频生成任务
     *
     * @param siteId      站点ID
     * @param model       模型: sora-2 或 sora-2-pro
     * @param prompt      提示词
     * @param aspectRatio 视频宽高比: 16:9 或 9:16
     * @param duration    时长(秒): 10, 15, 25
     * @param imageUrls   参考图URLs (可选)
     * @param characters  多角色客串配置 (可选)
     * @return API响应
     */
    public JSONObject createVideoTask(Long siteId, String model, String prompt, String aspectRatio,
                                      Integer duration, List<String> imageUrls,
                                      String characters) {
        // 获取站点配置
        SiteConfigProvider.DuomiApiConfig config = siteConfigProvider.getDuomiApiConfig(siteId);
        String url = config.getApiUrl() + "/v1/videos/generations";

        Map<String, Object> data = new HashMap<>();
        data.put("model", StrUtil.isBlank(model) ? "sora-2" : model);
        if (StrUtil.isNotEmpty(prompt)) {
            prompt = "Clean image, no text, no logos, no subtitles, no watermarks." + prompt;
        }
        data.put("prompt", prompt);

        if (StrUtil.isNotBlank(aspectRatio)) {
            data.put("aspect_ratio", aspectRatio);
        }

        if (duration != null) {
            data.put("duration", duration);
        }

        if (imageUrls != null && !imageUrls.isEmpty()) {
            data.put("image_urls", imageUrls);
        }

        if (StrUtil.isNotBlank(characters)) {
            data.put("characters", characters);
        }

        if (StrUtil.isNotBlank(config.getVideoCallbackUrl())) {
            data.put("callback_url", config.getVideoCallbackUrl());
        }

        return sendRequest(url, data, "POST", config.getApiKey());
    }

    /**
     * 查询视频生成任务状态
     *
     * @param siteId 站点ID
     * @param taskId 任务ID
     * @return API响应
     */
    public JSONObject queryTaskStatus(Long siteId, String taskId) {
        SiteConfigProvider.DuomiApiConfig config = siteConfigProvider.getDuomiApiConfig(siteId);
        String url = config.getApiUrl() + "/v1/videos/tasks/" + taskId;
        return sendRequest(url, null, "GET", config.getApiKey());
    }

    private JSONObject sendRequest(String url, Map<String, Object> data, String method, String apiKey) {
        try {
            Map<String, String> headers = new HashMap<>();
            headers.put("Authorization", apiKey);

            if ("POST".equalsIgnoreCase(method)) {
                return HttpClientUtil.sendPostRequest(url, data, headers);
            } else if ("GET".equalsIgnoreCase(method)) {
                return HttpClientUtil.sendGetRequest(url, headers);
            }

            return null;

        } catch (Exception e) {
            log.error("SORA API请求异常: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 从响应中提取任务ID
     */
    public String extractTaskId(JSONObject response) {
        if (response == null) {
            return null;
        }

        // 直接返回id字段
        if (response.containsKey("id")) {
            return response.getString("id");
        }

        return null;
    }

    /**
     * 检查任务是否已完成
     */
    public boolean isTaskCompleted(JSONObject response) {
        if (response == null) {
            return false;
        }

        // 检查state字段是否为succeeded
        if (response.containsKey("state")) {
            String state = response.getString("state");
            return "succeeded".equals(state);
        }

        return false;
    }

    /**
     * 检查任务是否失败
     */
    public boolean isTaskFailed(JSONObject response) {
        if (response == null) {
            return false;
        }

        // 检查state字段是否为error
        if (response.containsKey("state")) {
            String state = response.getString("state");
            return "error".equals(state);
        }

        return false;
    }

    /**
     * 从响应中提取结果视频URL
     */
    public String extractResultUrl(JSONObject response) {
        if (response == null) {
            return null;
        }

        // 获取data对象
        JSONObject data = response.getJSONObject("data");
        if (data == null) {
            return null;
        }

        // 从 data.videos[0].url 获取视频URL
        JSONArray videos = data.getJSONArray("videos");
        if (videos != null && !videos.isEmpty()) {
            Object firstVideo = videos.get(0);

            // 如果是对象，从 url 字段获取
            if (firstVideo instanceof JSONObject) {
                JSONObject videoObj = (JSONObject) firstVideo;
                if (videoObj.containsKey("url")) {
                    return videoObj.getString("url");
                }
            }

            // 如果是字符串，直接返回
            if (firstVideo instanceof String) {
                return (String) firstVideo;
            }
        }

        return null;
    }

    /**
     * 从响应中提取错误信息
     */
    public String extractErrorMessage(JSONObject response) {
        if (response == null) {
            return "Unknown error";
        }

        // 从message字段获取错误信息
        if (response.containsKey("message") && StrUtil.isNotBlank(response.getString("message"))) {
            return response.getString("message");
        }

        // 兼容其他格式
        if (response.containsKey("msg") && StrUtil.isNotBlank(response.getString("msg"))) {
            String msg = response.getString("msg");
            if (!"success".equalsIgnoreCase(msg)) {
                return msg;
            }
        }

        if (response.containsKey("error")) {
            return response.getString("error");
        }

        return "Unknown error";
    }

    /**
     * 从响应中提取任务进度
     */
    public Integer extractProgress(JSONObject response) {
        if (response == null) {
            return 0;
        }

        if (response.containsKey("progress")) {
            return response.getInteger("progress");
        }

        return 0;
    }
}
