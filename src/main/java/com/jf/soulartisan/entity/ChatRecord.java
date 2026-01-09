package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * AI聊天记录实体
 */
@Data
@TableName(value = "chat_records", autoResultMap = true)
public class ChatRecord {

    /**
     * 主键ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 模型名称
     */
    private String model;

    /**
     * 聊天场景代码
     */
    private String scenario;

    /**
     * 消息列表 (JSON格式)
     */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<Map<String, String>> messages;

    /**
     * 请求参数 (JSON格式)
     */
    @TableField(typeHandler = JacksonTypeHandler.class)
    private Map<String, Object> requestParams;

    /**
     * 响应内容
     */
    private String responseContent;

    /**
     * 输入文本长度
     */
    private Integer inputLength;

    /**
     * 输出文本长度
     */
    private Integer outputLength;

    /**
     * 提示词token数
     */
    private Integer promptTokens;

    /**
     * 完成token数
     */
    private Integer completionTokens;

    /**
     * 总token数
     */
    private Integer totalTokens;

    /**
     * 状态: success, error
     */
    private String status;

    /**
     * 错误信息
     */
    private String errorMessage;

    /**
     * 请求时间
     */
    private LocalDateTime requestTime;

    /**
     * 响应时间
     */
    private LocalDateTime responseTime;

    /**
     * 耗时(毫秒)
     */
    private Integer durationMs;

    /**
     * 创建时间
     */
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    /**
     * 状态常量
     */
    public static class Status {
        public static final String SUCCESS = "success";
        public static final String ERROR = "error";
    }
}
