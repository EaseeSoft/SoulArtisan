package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

/**
 * 创建视频生成任务请求参数
 */
@Data
@Schema(description = "创建视频生成任务请求参数")
public class CreateVideoRequest {

    @NotBlank(message = "提示词不能为空")
    @Schema(description = "提示词", example = "一只小猫在跳舞", requiredMode = Schema.RequiredMode.REQUIRED)
    private String prompt;

    @Schema(description = "模型", example = "sora-2", defaultValue = "sora-2")
    private String model = "sora-2";

    @Schema(description = "视频宽高比", example = "16:9", defaultValue = "16:9")
    private String aspectRatio = "16:9";

    @Schema(description = "视频时长(秒)", example = "10", defaultValue = "10")
    private Integer duration = 10;

    @Schema(description = "参考图URL列表（可选）")
    private List<String> imageUrls;

    @Schema(description = "多角色客串配置（JSON格式，可选）")
    private String characters;

    @Schema(description = "关联的工作流项目ID（可选）")
    private Long projectId;

    @Schema(description = "关联的剧本ID（可选）")
    private Long scriptId;
}
