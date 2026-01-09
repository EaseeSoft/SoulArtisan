package com.jf.soulartisan.admin.controller;

import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaAdminCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.service.CosService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 管理员文件上传Controller
 */
@Slf4j
@Tag(name = "管理员文件上传", description = "管理员文件上传相关接口")
@RestController
@RequestMapping("/admin/file")
@RequiredArgsConstructor
@SaAdminCheckLogin
public class AdminFileController {

    private final CosService cosService;

    /**
     * 上传单个文件
     */
    @Operation(summary = "上传文件", description = "管理员上传单个文件到腾讯云COS")
    @PostMapping("/upload")
    public Result<Map<String, Object>> uploadFile(
            @Parameter(description = "文件", required = true)
            @RequestParam("file") MultipartFile file
    ) {
        Long adminId = StpKit.ADMIN.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAdminLoginUserSiteId();
        log.info("管理员[{}]开始上传文件: {}", adminId, file.getOriginalFilename());

        // 上传文件到COS
        String fileUrl = cosService.uploadFile(siteId, file);

        Map<String, Object> result = new HashMap<>();
        result.put("url", fileUrl);
        result.put("fileName", file.getOriginalFilename());
        result.put("fileSize", file.getSize());

        log.info("管理员[{}]文件上传成功: {}", adminId, fileUrl);
        return Result.success(result);
    }

    /**
     * 删除文件
     */
    @Operation(summary = "删除文件", description = "从腾讯云COS删除文件")
    @DeleteMapping("/delete")
    public Result<String> deleteFile(
            @Parameter(description = "文件URL", required = true)
            @RequestParam("fileUrl") String fileUrl
    ) {
        Long adminId = StpKit.ADMIN.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAdminLoginUserSiteId();
        log.info("管理员[{}]开始删除文件: {}", adminId, fileUrl);

        cosService.deleteFile(siteId, fileUrl);

        log.info("管理员[{}]文件删除成功: {}", adminId, fileUrl);
        return Result.success("文件删除成功");
    }
}
