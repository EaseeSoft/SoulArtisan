package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * 创建角色生成任务请求参数
 */
@Data
@Schema(description = "创建角色生成任务请求参数")
public class CharacterGenerationRequest {

    @NotNull(message = "项目ID不能为空")
    @Schema(description = "工作流项目ID", example = "1", requiredMode = Schema.RequiredMode.REQUIRED)
    private Long projectId;

    @Schema(description = "角色名称", example = "主角")
    private String characterName;

    @Schema(description = "源视频URL（与fromTask二选一）", example = "https://example.com/video.mp4")
    private String url;

    @Schema(description = "已生成的视频任务ID（与url二选一，支持真人）", example = "cca6afcd-86e5-3a86-5a26-63dad7750682")
    private String fromTask;

    @NotBlank(message = "时间戳范围不能为空")
    @Pattern(regexp = "^\\d+(\\.\\d+)?,\\d+(\\.\\d+)?$", message = "时间戳格式错误，格式应为 起始秒,结束秒，例如: 0,3")
    @Schema(description = "角色出现的时间戳范围，格式: 起始秒,结束秒", example = "3,6", requiredMode = Schema.RequiredMode.REQUIRED)
    private String timestamps;

    /**
     * 验证url和fromTask至少有一个不为空
     */
    public void validate() {
        if ((url == null || url.isBlank()) && (fromTask == null || fromTask.isBlank())) {
            throw new IllegalArgumentException("url和fromTask必须设置其中一个");
        }
        if ((url != null && !url.isBlank()) && (fromTask != null && !fromTask.isBlank())) {
            throw new IllegalArgumentException("url和fromTask只能设置其中一个");
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
