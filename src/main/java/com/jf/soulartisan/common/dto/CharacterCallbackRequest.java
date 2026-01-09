package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 角色生成回调请求参数
 */
@Data
@Schema(description = "角色生成回调请求参数")
public class CharacterCallbackRequest {

    @Schema(description = "角色生成任务ID", example = "58b591ad-f53c-13b0-1075-6c7ca85f8ad2")
    private String id;

    @Schema(description = "任务状态", example = "succeeded")
    private String state;

    @Schema(description = "进度", example = "100")
    private Integer progress;

    @Schema(description = "角色数据")
    private DataWrapper data;

    @Schema(description = "创建时间", example = "1765696421")
    private Long createTime;

    @Schema(description = "更新时间", example = "1765696477")
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
        @Schema(description = "角色列表")
        private List<CharacterInfo> characters;
    }

    /**
     * 角色信息
     */
    @Data
    public static class CharacterInfo {
        @Schema(description = "角色ID", example = "cynthiedy.circuitsag")
        private String id;
    }
}
