package com.jf.soulartisan.dto.characterproject;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 绑定资源请求（从剧本选择资源）
 */
@Data
@Schema(description = "绑定资源请求")
public class BindResourcesRequest {

    @NotNull(message = "来源剧本ID不能为空")
    @Schema(description = "来源剧本ID", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long scriptId;

    @NotEmpty(message = "资源ID列表不能为空")
    @Schema(description = "要绑定的资源ID列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Long> resourceIds;
}
