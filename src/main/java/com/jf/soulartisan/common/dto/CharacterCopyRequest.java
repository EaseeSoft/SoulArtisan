package com.jf.soulartisan.common.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 复制角色到其他剧本请求
 */
@Data
@Schema(description = "复制角色到其他剧本请求")
public class CharacterCopyRequest {

    @NotNull(message = "目标剧本ID不能为空")
    @Schema(description = "目标剧本ID", required = true)
    private Long targetScriptId;

    @Schema(description = "新的角色名称（可选，不填则使用原名称）")
    private String newCharacterName;
}
