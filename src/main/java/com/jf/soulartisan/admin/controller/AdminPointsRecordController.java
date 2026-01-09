package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.dto.request.PointsAdjustRequest;
import com.jf.soulartisan.admin.dto.request.PointsRecordQueryRequest;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.admin.service.PointsRecordService;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 积分记录控制器
 * 站点管理员可以查看和调整用户积分
 */
@Tag(name = "积分记录", description = "积分记录查询和调整接口")
@RestController
@RequestMapping("/admin/points")
@SaAdminCheckLogin
public class AdminPointsRecordController {

    @Autowired
    private PointsRecordService pointsRecordService;

    @Autowired
    private AdminUserMapper adminUserMapper;

    /**
     * 获取当前管理员的站点ID（系统管理员无权限）
     */
    private Long requireSiteAdmin() {
        Long adminId = StpKit.ADMIN.getLoginIdAsLong();
        AdminUser adminUser = adminUserMapper.selectById(adminId);
        if (adminUser == null) {
            throw new ServiceException("管理员信息不存在");
        }
        if (adminUser.getSiteId() == null) {
            throw new ServiceException("系统管理员无权操作积分，请使用站点管理员账号");
        }
        return adminUser.getSiteId();
    }

    /**
     * 获取积分记录列表
     */
    @Operation(summary = "获取积分记录列表", description = "分页获取积分记录列表")
    @GetMapping("/records")
    public Result<PageResult<Map<String, Object>>> getRecordList(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize,
            PointsRecordQueryRequest request) {
        Long siteId = requireSiteAdmin();
        PageResult<Map<String, Object>> pageResult = pointsRecordService.getRecordList(siteId, pageNum, pageSize, request);
        return Result.success(pageResult);
    }

    /**
     * 调整用户积分
     */
    @Operation(summary = "调整用户积分", description = "管理员手动调整用户积分")
    @AdminLog(module = "积分管理", operation = "调整用户积分")
    @PostMapping("/adjust")
    public Result<Void> adjustPoints(@Valid @RequestBody PointsAdjustRequest request) {
        Long siteId = requireSiteAdmin();
        pointsRecordService.adjustPoints(siteId, request);
        return Result.success(null);
    }
}
