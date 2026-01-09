package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 绑定分镜资源请求
 */
@Data
@Schema(description = "绑定分镜资源请求")
public class BindStoryboardResourcesRequest {

    @NotEmpty(message = "资源列表不能为空")
    @Schema(description = "资源列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<ResourceBinding> resources;

    @Data
    @Schema(description = "资源绑定")
    public static class ResourceBinding {

        @Schema(description = "资源ID", requiredMode = Schema.RequiredMode.REQUIRED)
        private Long resourceId;

        @Schema(description = "资源角色: main_character-主角, supporting-配角, scene-场景, prop-道具")
        private String resourceRole;
    }
}
