package com.jf.soulartisan.common.dto;

import lombok.Data;

/**
 * 查询工作流项目列表请求
 */
@Data
public class WorkflowProjectQueryRequest {

    private Integer page = 1;

    private Integer pageSize = 20;

    /**
     * 搜索关键词（匹配名称或描述）
     */
    private String keyword;

    /**
     * 按剧本ID筛选
     */
    private Long scriptId;

    /**
     * 按工作流类型筛选: character-resource | storyboard
     */
    private String workflowType;

    /**
     * 排序字段：createdAt | updatedAt | lastOpenedAt
     */
    private String sortBy = "updatedAt";

    /**
     * 排序顺序：asc | desc
     */
    private String sortOrder = "desc";

    /**
     * 校验并修正参数
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
        if (sortBy == null || (!sortBy.equals("createdAt") && !sortBy.equals("updatedAt") && !sortBy.equals("lastOpenedAt"))) {
            sortBy = "updatedAt";
        }
        if (sortOrder == null || (!sortOrder.equals("asc") && !sortOrder.equals("desc"))) {
            sortOrder = "desc";
        }
    }
}
