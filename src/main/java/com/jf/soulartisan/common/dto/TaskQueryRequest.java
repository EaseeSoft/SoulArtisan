package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 任务查询请求参数
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "任务查询请求参数")
public class TaskQueryRequest extends PageRequest {

    @Schema(description = "任务状态", example = "PENDING")
    private String status;

    @Schema(description = "任务类型", example = "TEXT2IMAGE")
    private String type;

    @Schema(description = "项目ID（按项目筛选视频任务）")
    private Long projectId;
}
