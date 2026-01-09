package com.jf.soulartisan.admin.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 视频任务详情响应
 */
@Data
@Schema(description = "视频任务详情")
public class VideoTaskDetailResponse {

    @Schema(description = "任务ID")
    private Long id;

    @Schema(description = "用户ID")
    private Long userId;

    @Schema(description = "用户名")
    private String username;

    @Schema(description = "站点ID")
    private Long siteId;

    @Schema(description = "站点名称")
    private String siteName;

    @Schema(description = "任务ID（外部）")
    private String taskId;

    @Schema(description = "提示词")
    private String prompt;

    @Schema(description = "图片URL列表")
    private List<String> imageUrls;

    @Schema(description = "宽高比")
    private String aspectRatio;

    @Schema(description = "时长")
    private Integer duration;

    @Schema(description = "角色信息")
    private String characters;

    @Schema(description = "回调URL")
    private String callbackUrl;

    @Schema(description = "状态")
    private String status;

    @Schema(description = "结果URL")
    private String resultUrl;

    @Schema(description = "错误信息")
    private String errorMessage;

    @Schema(description = "进度")
    private Integer progress;

    @Schema(description = "创建时间")
    private LocalDateTime createdAt;

    @Schema(description = "更新时间")
    private LocalDateTime updatedAt;

    @Schema(description = "完成时间")
    private LocalDateTime completedAt;
}
