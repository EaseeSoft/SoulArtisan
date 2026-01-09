package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 分页请求基础类
 */
@Data
@Schema(description = "分页请求参数")
public class PageRequest {

    @Schema(description = "页码", example = "1", defaultValue = "1")
    private Integer page = 1;

    @Schema(description = "每页大小", example = "20", defaultValue = "20")
    private Integer pageSize = 20;

    /**
     * 获取 MyBatis-Plus 分页对象的偏移量
     */
    public long getOffset() {
        return (long) (page - 1) * pageSize;
    }

    /**
     * 校验并修正分页参数
     */
    public void validateAndCorrect() {
        if (page == null || page < 1) {
            page = 1;
        }
        if (pageSize == null || pageSize < 1) {
            pageSize = 20;
        }
        if (pageSize > 100) {
            pageSize = 100;
        }
    }
}
