package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 视频生成回调请求参数
 */
@Data
@Schema(description = "视频生成回调请求参数")
public class VideoCallbackRequest {

    @Schema(description = "视频生成任务ID", example = "81dfa5d7-31ae-a8f3-bffb-4e323f331ffa")
    private String id;

    @Schema(description = "任务状态", example = "succeeded")
    private String state;

    @Schema(description = "进度", example = "100")
    private Integer progress;

    @Schema(description = "视频数据")
    private DataWrapper data;

    @Schema(description = "创建时间", example = "1765785718")
    private Long createTime;

    @Schema(description = "更新时间", example = "1765785940")
    private Long updateTime;

    @Schema(description = "错误信息", example = "")
    private String message;

    @Schema(description = "操作类型", example = "generate")
    private String action;

    /**
     * 数据包装类
     */
    @Data
    public static class DataWrapper {
        @Schema(description = "视频列表")
        private List<VideoInfo> videos;
    }

    /**
     * 视频信息
     */
    @Data
    public static class VideoInfo {
        @Schema(description = "视频URL")
        private String url;
    }
}
