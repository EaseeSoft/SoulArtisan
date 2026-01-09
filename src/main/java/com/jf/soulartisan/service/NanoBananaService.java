package com.jf.soulartisan.service;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONArray;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.common.util.HttpClientUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class NanoBananaService {

    @Autowired
    private SiteConfigProvider siteConfigProvider;

    public JSONObject textToImage(Long siteId, String prompt, String model, String aspectRatio, String imageSize) {
        SiteConfigProvider.DuomiApiConfig config = siteConfigProvider.getDuomiApiConfig(siteId);
        String url = config.getApiUrl() + "/api/gemini/nano-banana";

        Map<String, Object> data = new HashMap<>();
        data.put("model", StrUtil.isBlank(model) ? "gemini-3-pro-image-preview" : model);
        prompt = "Clean image, no text, no logos, no subtitles, no watermarks." + prompt;
        data.put("prompt", prompt);
        data.put("aspect_ratio", StrUtil.isBlank(aspectRatio) ? "auto" : aspectRatio);

        if (StrUtil.isNotBlank(imageSize) && "gemini-3-pro-image-preview".equals(model)) {
            data.put("image_size", imageSize);
        }

        return sendRequest(url, data, "POST", config.getApiKey());
    }

    public JSONObject imageToImage(Long siteId, String prompt, List<String> imageUrls, String model, String aspectRatio, String imageSize) {
        SiteConfigProvider.DuomiApiConfig config = siteConfigProvider.getDuomiApiConfig(siteId);
        String url = config.getApiUrl() + "/api/gemini/nano-banana-edit";

        Map<String, Object> data = new HashMap<>();
        data.put("model", StrUtil.isBlank(model) ? "gemini-3-pro-image-preview" : model);
        prompt = "Clean image, no text, no logos, no subtitles, no watermarks." + prompt;
        data.put("prompt", prompt);
        data.put("image_urls", imageUrls);
        data.put("aspect_ratio", StrUtil.isBlank(aspectRatio) ? "auto" : aspectRatio);

        if (StrUtil.isNotBlank(imageSize) && "gemini-3-pro-image-preview".equals(model)) {
            data.put("image_size", imageSize);
        }

        return sendRequest(url, data, "POST", config.getApiKey());
    }

    public JSONObject queryTaskStatus(Long siteId, String taskId) {
        SiteConfigProvider.DuomiApiConfig config = siteConfigProvider.getDuomiApiConfig(siteId);
        String url = config.getApiUrl() + "/api/gemini/nano-banana/" + taskId;
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
            log.error("NANO-BANANA API请求异常: {}", e.getMessage(), e);
            return null;
        }
    }

    public String extractTaskId(JSONObject response) {
        if (response == null) {
            return null;
        }

        JSONObject data = response.getJSONObject("data");
        if (data != null && data.containsKey("task_id")) {
            return data.getString("task_id");
        }

        if (response.containsKey("task_id")) {
            return response.getString("task_id");
        }

        return null;
    }

    public boolean isTaskCompleted(JSONObject response) {
        if (response == null) {
            return false;
        }

        // 检查响应码
        Integer code = response.getInteger("code");
        if (code == null || code != 200) {
            return false;
        }

        // 检查 data.state 是否为 succeeded
        JSONObject data = response.getJSONObject("data");
        if (data != null && data.containsKey("state")) {
            String state = data.getString("state");
            return "succeeded".equals(state);
        }

        return false;
    }

    public boolean isTaskFailed(JSONObject response) {
        if (response == null) {
            return false;
        }

        // 检查响应码，非200表示失败
        Integer code = response.getInteger("code");
        if (code != null && code != 200) {
            return true;
        }

        // 检查 data.state 是否为 error
        JSONObject data = response.getJSONObject("data");
        if (data != null && data.containsKey("state")) {
            String state = data.getString("state");
            return "error".equals(state) || "failed".equals(state);
        }

        return false;
    }

    public String extractResultUrl(JSONObject response) {
        if (response == null) {
            return null;
        }

        // 获取外层 data 对象
        JSONObject data = response.getJSONObject("data");
        if (data == null) {
            return null;
        }

        // 获取内层 data 对象（实际数据）
        JSONObject innerData = data.getJSONObject("data");
        if (innerData != null) {
            // 从 data.data.images[0].url 获取图片URL
            JSONArray images = innerData.getJSONArray("images");
            if (images != null && !images.isEmpty()) {
                Object firstImage = images.get(0);

                // 如果是对象，从 url 字段获取
                if (firstImage instanceof JSONObject) {
                    JSONObject imageObj = (JSONObject) firstImage;
                    if (imageObj.containsKey("url")) {
                        return imageObj.getString("url");
                    }
                }

                // 如果是字符串，直接返回
                if (firstImage instanceof String) {
                    return (String) firstImage;
                }
            }

            // 兼容其他可能的格式
            if (innerData.containsKey("image_url")) {
                return innerData.getString("image_url");
            }

            if (innerData.containsKey("url")) {
                return innerData.getString("url");
            }
        }

        return null;
    }

    public String extractErrorMessage(JSONObject response) {
        if (response == null) {
            return "Unknown error";
        }

        // 优先从 data.msg 获取错误信息
        JSONObject data = response.getJSONObject("data");
        if (data != null && data.containsKey("msg") && StrUtil.isNotBlank(data.getString("msg"))) {
            return data.getString("msg");
        }

        // 兼容其他格式
        if (response.containsKey("msg") && StrUtil.isNotBlank(response.getString("msg"))) {
            String msg = response.getString("msg");
            // 如果是 "success" 则不作为错误信息
            if (!"success".equalsIgnoreCase(msg)) {
                return msg;
            }
        }

        if (response.containsKey("message")) {
            return response.getString("message");
        }

        if (data != null && data.containsKey("error")) {
            return data.getString("error");
        }

        return "Unknown error";
    }
}
