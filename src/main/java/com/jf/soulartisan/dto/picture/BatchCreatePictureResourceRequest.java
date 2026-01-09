package com.jf.soulartisan.dto.picture;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 批量创建图片资源请求
 */
@Data
public class BatchCreatePictureResourceRequest {

    /**
     * 剧本ID
     */
    @NotNull(message = "剧本ID不能为空")
    private Long scriptId;

    /**
     * 资源列表
     */
    @NotEmpty(message = "资源列表不能为空")
    @Valid
    private List<ResourceItem> resources;

    /**
     * 资源项
     */
    @Data
    public static class ResourceItem {
        /**
         * 资源名称
         */
        @NotEmpty(message = "资源名称不能为空")
        private String name;

        /**
         * 资源类型: character-角色, scene-场景, prop-道具, skill-技能
         */
        @NotEmpty(message = "资源类型不能为空")
        private String type;

        /**
         * 资源描述/提示词
         */
        private String prompt;

        /**
         * 资源图片URL（如果为空，状态为未生成）
         */
        private String imageUrl;
    }
}
