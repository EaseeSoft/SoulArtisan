package com.jf.soulartisan.service;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.common.util.HttpClientUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CharacterService {

    private final SiteConfigProvider siteConfigProvider;

    /**
     * 创建角色生成任务
     *
     * @param siteId     站点ID
     * @param url        源视频URL（与fromTask二选一）
     * @param fromTask   已生成的视频任务ID（与url二选一）
     * @param timestamps 时间戳范围，格式: 起始秒,结束秒
     * @return API响应
     */
    public JSONObject createCharacterTask(Long siteId, String url, String fromTask, String timestamps) {
        // 获取站点配置
        SiteConfigProvider.DuomiApiConfig config = siteConfigProvider.getDuomiApiConfig(siteId);
        String requestUrl = config.getApiUrl() + "/v1/characters";

        Map<String, Object> data = new HashMap<>();

        // url 和 from_task 二选一
        if (StrUtil.isNotBlank(url)) {
            data.put("url", url);
        }

        if (StrUtil.isNotBlank(fromTask)) {
            data.put("from_task", fromTask);
        }

        // 必填参数
        data.put("timestamps", timestamps);

        // 回调URL从站点配置读取
        if (StrUtil.isNotBlank(config.getCharacterCallbackUrl())) {
            data.put("callback_url", config.getCharacterCallbackUrl());
            log.info("角色生成回调地址: {}", config.getCharacterCallbackUrl());
        }

        return sendRequest(requestUrl, data, "POST", config.getApiKey());
    }

    /**
     * 查询角色生成任务状态
     *
     * @param siteId      站点ID
     * @param characterId 角色ID
     * @return API响应
     */
    public JSONObject queryTaskStatus(Long siteId, String characterId) {
        SiteConfigProvider.DuomiApiConfig config = siteConfigProvider.getDuomiApiConfig(siteId);
        String url = config.getApiUrl() + "/v1/characters/" + characterId;
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
            log.error("角色生成API请求异常: {}", e.getMessage(), e);
            return null;
        }
    }

    /**
     * 从响应中提取角色ID
     */
    public String extractCharacterId(JSONObject response) {
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

        // 检查state字段是否为completed
        if (response.containsKey("state")) {
            String state = response.getString("state");
            return "completed".equals(state);
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

        // 检查state字段是否为failed
        if (response.containsKey("state")) {
            String state = response.getString("state");
            return "failed".equals(state);
        }

        return false;
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

        if (response.containsKey("error")) {
            return response.getString("error");
        }

        return "Unknown error";
    }
}
