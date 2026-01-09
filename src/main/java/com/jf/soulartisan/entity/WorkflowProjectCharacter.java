package com.jf.soulartisan.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 工作流项目与角色关联实体
 *
 * @deprecated 此类已废弃，角色与项目的关联关系已迁移到 Character 实体的 workflowProjectId 字段
 * @see Character#workflowProjectId
 */
@Deprecated
@Data
@TableName(value = "workflow_project_characters")
public class WorkflowProjectCharacter {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long workflowProjectId;

    private Long characterId;

    private Integer usageCount;

    private LocalDateTime lastUsedAt;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createdAt;

    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updatedAt;
}
