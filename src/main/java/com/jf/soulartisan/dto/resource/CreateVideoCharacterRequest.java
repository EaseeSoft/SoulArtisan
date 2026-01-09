package com.jf.soulartisan.dto.resource;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;


/**
 * 创建视频角色资源请求
 */
@Data
public class CreateVideoCharacterRequest {

    /**
     * 工作流项目ID
     */
    @NotNull(message = "项目ID不能为空")
    private Long projectId;

    /**
     * 资源名称
     */
    @NotBlank(message = "资源名称不能为空")
    private String resourceName;

    /**
     * 角色提示词
     */
    private String prompt;

    /**
     * 角色图片URL（用于生成视频）
     */
    private String characterImageUrl;

    /**
     * 时间戳字符串
     */
    @NotBlank(message = "时间戳不能为空")
    private String timestamps;

    /**
     * 开始时间
     */
    private String startTime;

    /**
     * 结束时间
     */
    private String endTime;

    /**
     * 是否为真人
     */
    private Boolean isRealPerson;
}
