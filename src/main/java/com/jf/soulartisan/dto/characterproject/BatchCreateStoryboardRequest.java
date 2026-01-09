package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 批量创建分镜请求
 */
@Data
@Schema(description = "批量创建分镜请求")
public class BatchCreateStoryboardRequest {

    @NotEmpty(message = "分镜列表不能为空")
    @Schema(description = "分镜列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<StoryboardItem> storyboards;

    @Data
    @Schema(description = "分镜项")
    public static class StoryboardItem {

        @Schema(description = "分镜序号", requiredMode = Schema.RequiredMode.REQUIRED)
        private Integer sceneNumber;

        @Schema(description = "分镜名称")
        private String sceneName;

        @Schema(description = "分镜描述")
        private String sceneDescription;

        @Schema(description = "关联资源列表")
        private List<ResourceBinding> resources;
    }

    @Data
    @Schema(description = "资源绑定")
    public static class ResourceBinding {

        @Schema(description = "资源ID", requiredMode = Schema.RequiredMode.REQUIRED)
        private Long resourceId;

        @Schema(description = "资源角色: main_character-主角, supporting-配角, scene-场景, prop-道具")
        private String resourceRole;
    }
}
