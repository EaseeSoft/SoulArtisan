package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 从视频资源生成角色请求
 */
@Data
@Schema(description = "从视频资源生成角色请求")
public class VideoResourceGenerateCharacterRequest {

    @NotNull(message = "资源ID不能为空")
    @Schema(description = "视频资源ID", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long resourceId;

    @Schema(description = "源视频URL（与videoTaskId二选一）")
    private String videoUrl;

    @Schema(description = "视频生成任务ID（与videoUrl二选一）")
    private String videoTaskId;

    @NotBlank(message = "时间戳范围不能为空")
    @Pattern(regexp = "^\\d+(\\.\\d+)?,\\d+(\\.\\d+)?$", message = "时间戳格式错误，格式应为 起始秒,结束秒")
    @Schema(description = "角色出现的时间戳范围，格式: 起始秒,结束秒", example = "3,6", requiredMode = Schema.RequiredMode.REQUIRED)
    private String timestamps;

    /**
     * 验证 videoUrl 和 videoTaskId 至少有一个不为空
     */
    public void validate() {
        if ((videoUrl == null || videoUrl.isBlank()) && (videoTaskId == null || videoTaskId.isBlank())) {
            throw new IllegalArgumentException("videoUrl和videoTaskId必须设置其中一个");
        }
        if ((videoUrl != null && !videoUrl.isBlank()) && (videoTaskId != null && !videoTaskId.isBlank())) {
            throw new IllegalArgumentException("videoUrl和videoTaskId只能设置其中一个");
        }

        // 验证时间戳范围
        String[] parts = timestamps.split(",");
        if (parts.length != 2) {
            throw new IllegalArgumentException("时间戳格式错误");
        }

        try {
            double startTime = Double.parseDouble(parts[0].trim());
            double endTime = Double.parseDouble(parts[1].trim());

            if (startTime < 0 || endTime < 0) {
                throw new IllegalArgumentException("时间戳不能为负数");
            }

            if (endTime <= startTime) {
                throw new IllegalArgumentException("结束时间必须大于起始时间");
            }

            double duration = endTime - startTime;
            if (duration < 1) {
                throw new IllegalArgumentException("时间范围差值最小1秒");
            }

            if (duration > 3) {
                throw new IllegalArgumentException("时间范围差值最大3秒");
            }

        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("时间戳必须是有效的数字");
        }
    }
}
