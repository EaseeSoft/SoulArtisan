package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 提取分镜请求
 */
@Data
@Schema(description = "提取分镜请求")
public class ExtractStoryboardsRequest {

    @Min(value = 1, message = "提取数量至少为1")
    @Schema(description = "提取分镜数量", example = "10")
    private Integer count = 10;
}
