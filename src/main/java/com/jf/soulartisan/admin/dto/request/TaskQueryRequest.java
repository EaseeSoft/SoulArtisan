package com.jf.soulartisan.admin.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 任务查询请求
 */
@Data
@Schema(description = "任务查询请求")
public class TaskQueryRequest {

    @Schema(description = "用户ID")
    private Long userId;

    @Schema(description = "任务状态")
    private String status;

    @Schema(description = "任务类型（图片任务：text2image、image2image）")
    private String type;

    @Schema(description = "模型名称")
    private String model;

    @Schema(description = "站点ID（系统管理员可指定，站点管理员自动使用当前站点）")
    private Long siteId;

    @Schema(description = "开始时间（格式：yyyy-MM-dd HH:mm:ss）")
    private String startTime;

    @Schema(description = "结束时间（格式：yyyy-MM-dd HH:mm:ss）")
    private String endTime;
}
