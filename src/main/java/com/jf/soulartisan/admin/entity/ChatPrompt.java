package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jf.soulartisan.common.entity.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * AI 聊天提示词配置实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("chat_prompts")
@Schema(description = "AI聊天提示词配置")
public class ChatPrompt extends BaseEntity {

    private static final long serialVersionUID = 1L;

    /**
     * 场景编码（唯一标识）
     */
    @Schema(description = "场景编码")
    private String code;

    /**
     * 场景名称
     */
    @Schema(description = "场景名称")
    private String label;

    /**
     * 场景描述
     */
    @Schema(description = "场景描述")
    private String description;

    /**
     * 系统提示词
     */
    @Schema(description = "系统提示词")
    private String systemPrompt;

    /**
     * 默认温度
     */
    @Schema(description = "默认温度")
    private BigDecimal defaultTemperature;

    /**
     * 默认最大token数
     */
    @Schema(description = "默认最大token数")
    private Integer defaultMaxTokens;

    /**
     * 是否启用：0-禁用，1-启用
     */
    @Schema(description = "是否启用：0-禁用，1-启用")
    private Integer isEnabled;

    /**
     * 排序顺序
     */
    @Schema(description = "排序顺序")
    private Integer sortOrder;

    /**
     * 启用状态常量
     */
    public static class EnableStatus {
        public static final Integer DISABLED = 0;
        public static final Integer ENABLED = 1;
    }
}
