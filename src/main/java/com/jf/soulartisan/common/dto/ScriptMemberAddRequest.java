package com.jf.soulartisan.common.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 添加剧本成员请求
 */
@Data
public class ScriptMemberAddRequest {

    /**
     * 要添加的用户ID列表
     */
    @NotEmpty(message = "用户ID列表不能为空")
    private List<Long> userIds;
}
