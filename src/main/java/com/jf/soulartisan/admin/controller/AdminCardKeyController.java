package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.dto.request.CardKeyGenerateRequest;
import com.jf.soulartisan.admin.dto.request.CardKeyQueryRequest;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.entity.CardKey;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.admin.service.CardKeyService;
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

import java.util.List;

/**
 * 卡密管理控制器
 * 仅站点管理员可访问，系统管理员无权限
 */
@Tag(name = "卡密管理", description = "卡密的生成和管理接口，仅站点管理员可访问")
@RestController
@RequestMapping("/admin/cardkey")
@SaAdminCheckLogin
public class AdminCardKeyController {

    @Autowired
    private CardKeyService cardKeyService;

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
            throw new ServiceException("系统管理员无权操作卡密，请使用站点管理员账号");
        }
        return adminUser.getSiteId();
    }

    /**
     * 批量生成卡密
     */
    @Operation(summary = "批量生成卡密", description = "批量生成指定数量的卡密")
    @AdminLog(module = "卡密管理", operation = "批量生成卡密")
    @PostMapping("/generate")
    public Result<List<CardKey>> generateCardKeys(@Valid @RequestBody CardKeyGenerateRequest request) {
        Long siteId = requireSiteAdmin();
        List<CardKey> cardKeys = cardKeyService.generateCardKeys(siteId, request);
        return Result.success(cardKeys);
    }

    /**
     * 获取卡密列表
     */
    @Operation(summary = "获取卡密列表", description = "分页获取卡密列表")
    @GetMapping("/list")
    public Result<PageResult<CardKey>> getCardKeyList(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize,
            CardKeyQueryRequest request) {
        Long siteId = requireSiteAdmin();
        PageResult<CardKey> pageResult = cardKeyService.getCardKeyList(siteId, pageNum, pageSize, request);
        return Result.success(pageResult);
    }

    /**
     * 获取卡密详情
     */
    @Operation(summary = "获取卡密详情", description = "获取单个卡密的详细信息")
    @GetMapping("/{id}")
    public Result<CardKey> getCardKeyDetail(
            @Parameter(description = "卡密ID") @PathVariable Long id) {
        Long siteId = requireSiteAdmin();
        CardKey cardKey = cardKeyService.getCardKeyDetail(siteId, id);
        return Result.success(cardKey);
    }

    /**
     * 禁用卡密
     */
    @Operation(summary = "禁用卡密", description = "禁用未使用的卡密")
    @AdminLog(module = "卡密管理", operation = "禁用卡密")
    @PutMapping("/{id}/disable")
    public Result<Void> disableCardKey(
            @Parameter(description = "卡密ID") @PathVariable Long id) {
        Long siteId = requireSiteAdmin();
        cardKeyService.disableCardKey(siteId, id);
        return Result.success(null);
    }

    /**
     * 启用卡密
     */
    @Operation(summary = "启用卡密", description = "启用已禁用的卡密")
    @AdminLog(module = "卡密管理", operation = "启用卡密")
    @PutMapping("/{id}/enable")
    public Result<Void> enableCardKey(
            @Parameter(description = "卡密ID") @PathVariable Long id) {
        Long siteId = requireSiteAdmin();
        cardKeyService.enableCardKey(siteId, id);
        return Result.success(null);
    }

    /**
     * 删除卡密
     */
    @Operation(summary = "删除卡密", description = "删除未使用的卡密")
    @AdminLog(module = "卡密管理", operation = "删除卡密")
    @DeleteMapping("/{id}")
    public Result<Void> deleteCardKey(
            @Parameter(description = "卡密ID") @PathVariable Long id) {
        Long siteId = requireSiteAdmin();
        cardKeyService.deleteCardKey(siteId, id);
        return Result.success(null);
    }

    /**
     * 批量删除卡密
     */
    @Operation(summary = "批量删除卡密", description = "批量删除未使用的卡密")
    @AdminLog(module = "卡密管理", operation = "批量删除卡密")
    @DeleteMapping("/batch")
    public Result<Void> batchDeleteCardKeys(@RequestBody List<Long> ids) {
        Long siteId = requireSiteAdmin();
        cardKeyService.batchDeleteCardKeys(siteId, ids);
        return Result.success(null);
    }

    /**
     * 获取批次号列表
     */
    @Operation(summary = "获取批次号列表", description = "获取当前站点的所有批次号")
    @GetMapping("/batch-list")
    public Result<List<String>> getBatchNoList() {
        Long siteId = requireSiteAdmin();
        List<String> batchNoList = cardKeyService.getBatchNoList(siteId);
        return Result.success(batchNoList);
    }
}
