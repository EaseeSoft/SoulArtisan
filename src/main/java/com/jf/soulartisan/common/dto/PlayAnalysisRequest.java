package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
@Schema(description = "剧本解析请求")
public class PlayAnalysisRequest {

    @NotBlank(message = "剧本内容不能为空")
    @Schema(description = "剧本内容")
    private String content;

    @Schema(description = "角色项目ID")
    private Long characterProjectId;

    @Schema(description = "风格")
    private String style;

    @Schema(description = "生成数量")
    private Integer storyboardCount = 0;

    @Schema(description = "媒体文件 URL（图片路径，用于分镜图转视频提示词时传入）")
    private String mediaUrl;
}
