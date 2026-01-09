package com.jf.soulartisan.common.util;

import com.alibaba.fastjson2.JSON;
import com.alibaba.fastjson2.JSONObject;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class JsonUtils {
    /**
     * 从包含其他字符的文本中提取 JSON 字符串
     * 支持提取对象 {...} 或数组 [...]
     *
     * @param text 包含 JSON 的文本
     * @return 提取的 JSON 字符串，如果提取失败返回 null
     */
    public static String extractJsonString(String text) {
        if (text == null || text.isEmpty()) {
            log.warn("输入文本为空");
            return null;
        }

        try {
            // 查找第一个 { 或 [ 的位置
            int startIndex = -1;
            char startChar = ' ';

            for (int i = 0; i < text.length(); i++) {
                char c = text.charAt(i);
                if (c == '{' || c == '[') {
                    startIndex = i;
                    startChar = c;
                    break;
                }
            }

            if (startIndex == -1) {
                log.warn("未找到 JSON 起始字符 {{ 或 [");
                return null;
            }

            // 确定结束字符
            char endChar = (startChar == '{') ? '}' : ']';

            // 使用栈计数器匹配括号
            int bracketCount = 0;
            int endIndex = -1;
            boolean inString = false;
            boolean escapeNext = false;

            for (int i = startIndex; i < text.length(); i++) {
                char c = text.charAt(i);

                // 处理字符串内的字符（忽略字符串内的括号）
                if (c == '"' && !escapeNext) {
                    inString = !inString;
                } else if (c == '\\' && !escapeNext) {
                    escapeNext = true;
                    continue;
                }

                if (!inString) {
                    if (c == startChar) {
                        bracketCount++;
                    } else if (c == endChar) {
                        bracketCount--;
                        if (bracketCount == 0) {
                            endIndex = i;
                            break;
                        }
                    }
                }

                escapeNext = false;
            }

            if (endIndex == -1) {
                log.warn("未找到匹配的 JSON 结束字符 {}", endChar);
                return null;
            }

            // 提取 JSON 字符串
            String jsonString = text.substring(startIndex, endIndex + 1);

            // 验证提取的字符串是否为有效 JSON
            try {
                if (startChar == '{') {
                    JSONObject.parseObject(jsonString);
                } else {
                    JSON.parseArray(jsonString);
                }
            } catch (Exception e) {
                log.warn("提取的字符串不是有效的 JSON: {}", jsonString.substring(0, Math.min(100, jsonString.length())));
                return null;
            }

            return jsonString;

        } catch (Exception e) {
            log.error("提取 JSON 字符串失败", e);
            return null;
        }
    }
}
