package com.jf.soulartisan.dto.picture;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 图片资源响应
 */
@Data
public class PictureResourceResponse {

    /**
     * 资源ID
     */
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 站点ID
     */
    private Long siteId;

    /**
     * 剧本ID
     */
    private Long scriptId;

    /**
     * 资源名称
     */
    private String name;

    /**
     * 资源类型
     */
    private String type;

    /**
     * 图片地址
     */
    private String imageUrl;

    /**
     * 提示词
     */
    private String prompt;

    /**
     * 状态：pending-未生成, generating-生成中, generated-已生成
     */
    private String status;

    /**
     * 创建时间
     */
    private LocalDateTime createdAt;

    /**
     * 更新时间
     */
    private LocalDateTime updatedAt;
}
