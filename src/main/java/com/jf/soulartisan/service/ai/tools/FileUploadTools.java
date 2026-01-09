package com.jf.soulartisan.service.ai.tools;

import cn.hutool.core.util.StrUtil;
import com.alibaba.fastjson2.JSONObject;
import com.jf.soulartisan.service.CosService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;

/**
 * 文件上传相关的Spring AI Tools
 * 用于Agent调用腾讯COS文件上传功能
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FileUploadTools {

    private final CosService cosService;

    /**
     * 通过URL下载文件并上传到腾讯COS
     *
     * @param siteId   站点ID（必填）
     * @param fileUrl  文件URL（必填）
     * @param fileName 保存的文件名（可选，不填则自动从URL提取）
     * @return 上传结果，包含COS访问URL
     */
    @Tool(description = "从URL下载文件并上传到腾讯COS。适用于需要将网络图片或文件保存到自己服务器的场景。返回COS文件访问URL。")
    public String uploadFileFromUrl(
            @ToolParam(description = "站点ID") Long siteId,
            @ToolParam(description = "要下载的文件URL") String fileUrl,
            @ToolParam(description = "保存的文件名，可选，不填则自动从URL提取", required = false) String fileName
    ) {
        log.info("[UploadFromUrl] 开始从URL上传文件: siteId={}, fileUrl={}", siteId, fileUrl);

        if (siteId == null) {
            return buildErrorResult("站点ID不能为空");
        }

        if (StrUtil.isBlank(fileUrl)) {
            return buildErrorResult("文件URL不能为空");
        }

        HttpURLConnection connection = null;
        InputStream inputStream = null;

        try {
            URL url = new URL(fileUrl);
            connection = (HttpURLConnection) url.openConnection();
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(60000);
            connection.setRequestMethod("GET");
            // 设置常见的请求头，避免被拦截
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            connection.connect();

            int responseCode = connection.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                return buildErrorResult("下载文件失败，HTTP状态码: " + responseCode);
            }

            inputStream = connection.getInputStream();

            // 读取文件内容
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
            byte[] fileBytes = outputStream.toByteArray();

            log.info("[UploadFromUrl] 文件下载成功，大小: {} KB", fileBytes.length / 1024);

            // 确定文件名
            String finalFileName = StrUtil.isNotBlank(fileName) ? fileName : extractFileName(fileUrl);

            // 上传到COS
            String cosUrl = cosService.uploadFile(siteId, fileBytes, finalFileName);

            log.info("[UploadFromUrl] 文件上传成功: {}", cosUrl);

            return buildSuccessResult("文件上传成功", cosUrl, finalFileName, fileBytes.length);

        } catch (Exception e) {
            log.error("[UploadFromUrl] 上传失败: {}", e.getMessage(), e);
            return buildErrorResult("文件上传失败: " + e.getMessage());
        } finally {
            try {
                if (inputStream != null) inputStream.close();
                if (connection != null) connection.disconnect();
            } catch (Exception ignored) {
            }
        }
    }

    /**
     * 上传Base64编码的文件到腾讯COS
     *
     * @param siteId        站点ID（必填）
     * @param base64Content Base64编码的文件内容（必填）
     * @param fileName      文件名（必填，需包含扩展名）
     * @return 上传结果
     */
    @Tool(description = "上传Base64编码的文件到腾讯COS。适用于将内存中的数据（如生成的图片）保存到服务器。返回COS文件访问URL。")
    public String uploadFileFromBase64(
            @ToolParam(description = "站点ID") Long siteId,
            @ToolParam(description = "Base64编码的文件内容") String base64Content,
            @ToolParam(description = "文件名，需包含扩展名如image.png") String fileName
    ) {
        log.info("[UploadFromBase64] 开始上传Base64文件: siteId={}, fileName={}", siteId, fileName);

        if (siteId == null) {
            return buildErrorResult("站点ID不能为空");
        }

        if (StrUtil.isBlank(base64Content)) {
            return buildErrorResult("文件内容不能为空");
        }

        if (StrUtil.isBlank(fileName)) {
            return buildErrorResult("文件名不能为空");
        }

        try {
            // 处理可能带有data:xxx;base64,前缀的情况
            String pureBase64 = base64Content;
            if (base64Content.contains(",")) {
                pureBase64 = base64Content.substring(base64Content.indexOf(",") + 1);
            }

            byte[] fileBytes = Base64.getDecoder().decode(pureBase64);

            log.info("[UploadFromBase64] 解码成功，文件大小: {} KB", fileBytes.length / 1024);

            String cosUrl = cosService.uploadFile(siteId, fileBytes, fileName);

            log.info("[UploadFromBase64] 文件上传成功: {}", cosUrl);

            return buildSuccessResult("文件上传成功", cosUrl, fileName, fileBytes.length);

        } catch (IllegalArgumentException e) {
            log.error("[UploadFromBase64] Base64解码失败: {}", e.getMessage());
            return buildErrorResult("Base64解码失败，请检查内容格式");
        } catch (Exception e) {
            log.error("[UploadFromBase64] 上传失败: {}", e.getMessage(), e);
            return buildErrorResult("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 检查文件是否存在
     *
     * @param siteId  站点ID
     * @param fileUrl COS文件URL
     * @return 检查结果
     */
    @Tool(description = "检查文件是否存在于腾讯COS中")
    public String checkFileExists(
            @ToolParam(description = "站点ID") Long siteId,
            @ToolParam(description = "COS文件URL") String fileUrl
    ) {
        log.info("[CheckFileExists] 检查文件: siteId={}, fileUrl={}", siteId, fileUrl);

        if (siteId == null || StrUtil.isBlank(fileUrl)) {
            return buildErrorResult("站点ID和文件URL不能为空");
        }

        try {
            boolean exists = cosService.fileExists(siteId, fileUrl);

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("exists", exists);
            result.put("fileUrl", fileUrl);

            return result.toJSONString();

        } catch (Exception e) {
            log.error("[CheckFileExists] 检查失败: {}", e.getMessage(), e);
            return buildErrorResult("检查文件失败: " + e.getMessage());
        }
    }

    /**
     * 获取文件的临时访问URL（带签名）
     *
     * @param siteId        站点ID
     * @param fileUrl       COS文件URL
     * @param expirationMin 过期时间（分钟）
     * @return 签名URL
     */
    @Tool(description = "获取COS文件的临时访问URL（带签名），用于私有文件的临时访问")
    public String getPresignedUrl(
            @ToolParam(description = "站点ID") Long siteId,
            @ToolParam(description = "COS文件URL") String fileUrl,
            @ToolParam(description = "过期时间（分钟），默认60", required = false) Integer expirationMin
    ) {
        log.info("[GetPresignedUrl] 获取签名URL: siteId={}, fileUrl={}", siteId, fileUrl);

        if (siteId == null || StrUtil.isBlank(fileUrl)) {
            return buildErrorResult("站点ID和文件URL不能为空");
        }

        try {
            int expMin = expirationMin != null && expirationMin > 0 ? expirationMin : 60;
            String presignedUrl = cosService.getPresignedUrl(siteId, fileUrl, expMin);

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("presignedUrl", presignedUrl);
            result.put("expirationMinutes", expMin);
            result.put("originalUrl", fileUrl);

            return result.toJSONString();

        } catch (Exception e) {
            log.error("[GetPresignedUrl] 获取签名URL失败: {}", e.getMessage(), e);
            return buildErrorResult("获取签名URL失败: " + e.getMessage());
        }
    }

    /**
     * 删除COS文件
     *
     * @param siteId  站点ID
     * @param fileUrl COS文件URL
     * @return 删除结果
     */
    @Tool(description = "删除腾讯COS中的文件")
    public String deleteFile(
            @ToolParam(description = "站点ID") Long siteId,
            @ToolParam(description = "要删除的COS文件URL") String fileUrl
    ) {
        log.info("[DeleteFile] 删除文件: siteId={}, fileUrl={}", siteId, fileUrl);

        if (siteId == null || StrUtil.isBlank(fileUrl)) {
            return buildErrorResult("站点ID和文件URL不能为空");
        }

        try {
            cosService.deleteFile(siteId, fileUrl);

            JSONObject result = new JSONObject();
            result.put("success", true);
            result.put("message", "文件删除成功");
            result.put("deletedUrl", fileUrl);

            return result.toJSONString();

        } catch (Exception e) {
            log.error("[DeleteFile] 删除失败: {}", e.getMessage(), e);
            return buildErrorResult("删除文件失败: " + e.getMessage());
        }
    }

    private String extractFileName(String fileUrl) {
        try {
            String path = new URL(fileUrl).getPath();
            String fileName = path.substring(path.lastIndexOf('/') + 1);

            // 去除URL参数
            if (fileName.contains("?")) {
                fileName = fileName.substring(0, fileName.indexOf("?"));
            }

            if (fileName.isEmpty() || !fileName.contains(".")) {
                return "file_" + System.currentTimeMillis();
            }
            return fileName;
        } catch (Exception e) {
            return "file_" + System.currentTimeMillis();
        }
    }

    private String buildSuccessResult(String message, String url, String fileName, int fileSize) {
        JSONObject result = new JSONObject();
        result.put("success", true);
        result.put("message", message);
        result.put("url", url);
        result.put("fileName", fileName);
        result.put("fileSize", fileSize);
        result.put("fileSizeKB", fileSize / 1024);
        return result.toJSONString();
    }

    private String buildErrorResult(String message) {
        JSONObject result = new JSONObject();
        result.put("success", false);
        result.put("message", message);
        return result.toJSONString();
    }
}
