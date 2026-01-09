package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 批量创建资源请求
 */
@Data
@Schema(description = "批量创建资源请求")
public class BatchCreateResourceRequest {

    @NotEmpty(message = "资源列表不能为空")
    @Schema(description = "资源列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ResourceItem> resources;

    @Data
    @Schema(description = "资源项")
    public static class ResourceItem {

        @Schema(description = "资源名称", requiredMode = Schema.RequiredMode.REQUIRED)
        private String resourceName;

        @Schema(description = "资源类型: character-人物, scene-场景, prop-道具, skill-技能")
        private String resourceType;

        @Schema(description = "资源描述/提示词")
        private String prompt;

        @Schema(description = "资源图片URL")
        private String imageUrl;
    }
}
