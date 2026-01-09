package com.jf.soulartisan.controller;

import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.entity.Attachment;
import com.jf.soulartisan.service.AttachmentService;
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
 * 文件上传Controller
 */
@Slf4j
@Tag(name = "文件上传", description = "文件上传相关接口")
@RestController
@RequestMapping("/file")
@RequiredArgsConstructor
public class FileUploadController {

    private final CosService cosService;
    private final AttachmentService attachmentService;

    /**
     * 上传单个文件
     */
    @Operation(summary = "上传文件", description = "上传单个文件到腾讯云COS")
    @PostMapping("/upload")
    @SaUserCheckLogin
    public Result<Map<String, Object>> uploadFile(
            @Parameter(description = "文件", required = true)
            @RequestParam("file") MultipartFile file
    ) {
        log.info("开始上传文件: {}", file.getOriginalFilename());

        // 获取当前登录用户ID和站点ID
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();

        // 上传文件到COS
        String fileUrl = cosService.uploadFile(siteId, file);

        // 保存附件记录到数据库
        Attachment attachment = attachmentService.saveAttachment(file, fileUrl, userId);

        Map<String, Object> result = new HashMap<>();
        result.put("id", attachment.getId());
        result.put("url", fileUrl);
        result.put("fileName", file.getOriginalFilename());
        result.put("fileType", attachment.getFileType());
        result.put("fileSize", attachment.getFileSize());

        log.info("文件上传成功: {}, 附件ID: {}", fileUrl, attachment.getId());
        return Result.success(result);
    }

    /**
     * 删除文件
     */
    @Operation(summary = "删除文件", description = "从腾讯云COS删除文件")
    @DeleteMapping("/delete")
    @SaUserCheckLogin
    public Result<String> deleteFile(
            @Parameter(description = "文件URL", required = true)
            @RequestParam("fileUrl") String fileUrl
    ) {
        log.info("开始删除文件: {}", fileUrl);

        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        cosService.deleteFile(siteId, fileUrl);

        log.info("文件删除成功: {}", fileUrl);
        return Result.success("文件删除成功");
    }

    /**
     * 检查文件是否存在
     */
    @Operation(summary = "检查文件是否存在", description = "检查文件在腾讯云COS中是否存在")
    @GetMapping("/exists")
    @SaUserCheckLogin
    public Result<Boolean> fileExists(
            @Parameter(description = "文件URL", required = true)
            @RequestParam("fileUrl") String fileUrl
    ) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        boolean exists = cosService.fileExists(siteId, fileUrl);
        return Result.success(exists);
    }

    /**
     * 获取文件签名URL（用于私有文件访问）
     */
    @Operation(summary = "获取文件签名URL", description = "获取文件的临时访问URL（用于私有文件）")
    @GetMapping("/presigned-url")
    @SaUserCheckLogin
    public Result<String> getPresignedUrl(
            @Parameter(description = "文件URL", required = true)
            @RequestParam("fileUrl") String fileUrl,
            @Parameter(description = "过期时间（分钟）", required = false)
            @RequestParam(value = "expirationMin", defaultValue = "60") int expirationMin
    ) {
        Long siteId = SecurityUtils.getRequiredAppLoginUserSiteId();
        String presignedUrl = cosService.getPresignedUrl(siteId, fileUrl, expirationMin);
        return Result.success(presignedUrl);
    }
}
