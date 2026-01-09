package com.jf.soulartisan.dto.resource;

import lombok.Data;

import java.math.BigDecimal;

/**
 * 视频角色资源详情
 * 对应 resourceType: video_character
 */
@Data
public class VideoCharacterDetails {
    /**
     * 角色ID（由外部系统生成）
     */
    private String videoCharacterId;

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
     * 角色图片URL
     */
    private String characterImageUrl;

    /**
     * 角色视频URL
     */
    private String characterVideoUrl;

    /**
     * 是否真人
     */
    private Boolean isRealPerson;

    /**
     * 原始结果数据
     */
    private Object resultData;
}
