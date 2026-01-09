package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.baomidou.mybatisplus.extension.handlers.JacksonTypeHandler;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@TableName(value = "image_generation_tasks", autoResultMap = true)
public class ImageGenerationTask {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long siteId;

    private String taskId;

    private String type;

    private String model;

    private String prompt;

    @TableField(typeHandler = JacksonTypeHandler.class)
    private List<String> imageUrls;

    private String aspectRatio;

    private String imageSize;

    private String status;

    private String resultUrl;

    private String errorMessage;

    private String adminRemark;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    private LocalDateTime completedAt;

    public static class Type {
        public static final String TEXT2IMAGE = "text2image";
        public static final String IMAGE2IMAGE = "image2image";
    }

    public static class Status {
        public static final String PENDING = "pending";
        public static final String PROCESSING = "processing";
        public static final String COMPLETED = "completed";
        public static final String FAILED = "failed";
    }
}
