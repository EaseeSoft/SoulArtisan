package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 查询剧本列表请求
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Schema(description = "查询剧本列表请求")
public class ScriptQueryRequest extends PageRequest {

    @Schema(description = "搜索关键词")
    private String keyword;

    @Schema(description = "状态筛选: active-活跃, archived-归档")
    private String status;

    @Schema(description = "排序字段", defaultValue = "updatedAt")
    private String sortBy = "updatedAt";

    @Schema(description = "排序方向", defaultValue = "desc")
    private String sortOrder = "desc";
}
