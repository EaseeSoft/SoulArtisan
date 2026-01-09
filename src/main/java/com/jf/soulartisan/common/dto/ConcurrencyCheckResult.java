package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 并发检查结果
 */
@Data
@Schema(description = "并发检查结果")
public class ConcurrencyCheckResult {

    /**
     * 是否允许提交
     */
    @Schema(description = "是否允许提交")
    private boolean allowed;

    /**
     * 提示信息
     */
    @Schema(description = "提示信息")
    private String message;

    /**
     * 当前配置的限制数
     */
    @Schema(description = "当前配置的限制数")
    private int limit;

    /**
     * 当前正在处理的任务数
     */
    @Schema(description = "当前正在处理的任务数")
    private long currentCount;

    /**
     * 允许提交
     */
    public static ConcurrencyCheckResult allowed() {
        ConcurrencyCheckResult result = new ConcurrencyCheckResult();
        result.setAllowed(true);
        return result;
    }

    /**
     * 拒绝提交
     */
    public static ConcurrencyCheckResult rejected(int limit, long currentCount) {
        ConcurrencyCheckResult result = new ConcurrencyCheckResult();
        result.setAllowed(false);
        result.setLimit(limit);
        result.setCurrentCount(currentCount);
        result.setMessage(String.format(
                "当前处理中的任务数(%d)已达上限(%d)，请稍后再试",
                currentCount, limit
        ));
        return result;
    }
}
