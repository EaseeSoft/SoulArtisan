package com.jf.soulartisan.dto.resource;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 视频场景资源详情
 * 对应 resourceType: video_scene
 */
@Data
public class VideoSceneDetails {
    /**
     * 场景ID（由外部系统生成）
     */
    private String videoSceneId;

    /**
     * 生成任务ID
     */
    private String generationTaskId;

    /**
     * 视频任务ID
     */
    private String videoTaskId;

    /**
     * 视频URL
     */
    private String videoUrl;

    /**
     * 时间戳字符串（JSON数组格式）
     */
    private String timestamps;

    /**
     * 开始时间
     */
    private BigDecimal startTime;

    /**
     * 结束时间
     */
    private BigDecimal endTime;

    /**
     * 原始结果数据
     */
    private Object resultData;
}
