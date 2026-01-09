package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 提取资源请求
 */
@Data
@Schema(description = "提取资源请求")
public class ExtractResourcesRequest {

    @Schema(description = "剧本内容（可选，如果不提供则使用项目已保存的剧本内容）")
    private String scriptContent;
}
