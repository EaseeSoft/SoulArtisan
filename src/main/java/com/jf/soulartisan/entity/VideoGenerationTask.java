package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName(value = "video_generation_tasks", autoResultMap = true)
public class VideoGenerationTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long siteId;

    /**
     * 关联的工作流项目ID（可选）
     */
    private Long projectId;

    /**
     * 关联的角色项目ID（可选）
     */
    private Long characterProjectId;

    /**
     * 关联的分镜ID（可选）
     */
    private Long storyboardId;

    /**
     * 关联的剧本ID（可选）
     */
    private Long scriptId;

    private String taskId;

    private String model;

    private String prompt;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> imageUrls;

    private String aspectRatio;

    private Integer duration;

    private String characters;

    private String callbackUrl;

    private String status;

    private String resultUrl;

    private String errorMessage;

    private String adminRemark;

    private Integer progress;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    public static class Model {
        public static final String SORA_2 = "sora-2";
        public static final String SORA_2_PRO = "sora-2-pro";
    }

    public static class Status {
        public static final String PENDING = "pending";
        public static final String RUNNING = "running";
        public static final String SUCCEEDED = "succeeded";
        public static final String ERROR = "error";
    }

    public static class AspectRatio {
        public static final String RATIO_16_9 = "16:9";
        public static final String RATIO_9_16 = "9:16";
    }

    public static class Duration {
        public static final int DURATION_10 = 10;
        public static final int DURATION_15 = 15;
        public static final int DURATION_25 = 25;
    }
}
