package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("attachments")
public class Attachment {

    @TableId(type = IdType.AUTO)
    private Long id;

    private String fileName;

    private String fileUrl;

    private Long fileSize;

    private String fileType;

    private String mimeType;

    private Long uploadUserId;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;

    public static class FileType {
        public static final String VIDEO = "video";
        public static final String IMAGE = "image";
        public static final String FILE = "file";
    }
}
