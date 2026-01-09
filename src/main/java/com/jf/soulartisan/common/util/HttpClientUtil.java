package com.jf.soulartisan.common.util;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
public class HttpClientUtil {

    // 默认超时时间：5分钟 (300秒)
    private static final int DEFAULT_TIMEOUT = 300000;

    public static JSONObject sendPostRequest(String url, Object data, Map<String, String> headers) {
        try {
            String jsonData = JSON.toJSONString(data);

            HttpRequest request = HttpRequest.post(url)
                    .timeout(DEFAULT_TIMEOUT)
                    .body(jsonData);

            if (headers != null && !headers.isEmpty()) {
                headers.forEach(request::header);
            }

            request.header("Content-Type", "application/json");

            HttpResponse response = request.execute();

            if (!response.isOk()) {
                log.error("HTTP请求失败: status={}, body={}", response.getStatus(), response.body());
                return null;
            }

            String responseBody = response.body();
            if (StrUtil.isBlank(responseBody)) {
                log.error("HTTP响应为空");
                return null;
            }

            return JSON.parseObject(responseBody);

        } catch (Exception e) {
            log.error("HTTP请求异常: {}", e.getMessage(), e);
            return null;
        }
    }

    public static JSONObject sendGetRequest(String url, Map<String, String> headers) {
        try {
            HttpRequest request = HttpRequest.get(url)
                    .timeout(DEFAULT_TIMEOUT);

            if (headers != null && !headers.isEmpty()) {
                headers.forEach(request::header);
            }

            HttpResponse response = request.execute();

            if (!response.isOk()) {
                log.error("HTTP GET请求失败: status={}, body={}", response.getStatus(), response.body());
                return null;
            }

            String responseBody = response.body();
            if (StrUtil.isBlank(responseBody)) {
                log.error("HTTP GET响应为空");
                return null;
            }

            return JSON.parseObject(responseBody);

        } catch (Exception e) {
            log.error("HTTP GET请求异常: {}", e.getMessage(), e);
            return null;
        }
    }
}
