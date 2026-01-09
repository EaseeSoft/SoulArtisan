package com.jf.soulartisan.service;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.util.IdUtil;
import com.jf.soulartisan.common.exception.ServiceException;
import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.exception.CosClientException;
import com.qcloud.cos.exception.CosServiceException;
import com.qcloud.cos.model.GeneratePresignedUrlRequest;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.PutObjectRequest;
import com.qcloud.cos.model.PutObjectResult;
import com.qcloud.cos.region.Region;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 腾讯云COS服务类
 * 支持多站点配置
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CosService {

    private final SiteConfigProvider siteConfigProvider;

    /**
     * 站点COS客户端缓存
     */
    private final Map<Long, CosClientWrapper> clientCache = new ConcurrentHashMap<>();

    /**
     * 上传文件
     *
     * @param siteId 站点ID
     * @param file   文件
     * @return 文件访问URL
     */
    public String uploadFile(Long siteId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ServiceException("文件不能为空");
        }

        try {
            CosClientWrapper wrapper = getCosClient(siteId);

            // 生成文件路径
            String filePath = generateFilePath(file.getOriginalFilename());

            // 上传文件
            uploadFile(wrapper, file.getInputStream(), filePath, file.getContentType());

            // 返回访问URL
            return getFileUrl(wrapper.getConfig(), filePath);
        } catch (IOException e) {
            log.error("文件上传失败", e);
            throw new ServiceException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传文件（使用字节数组）
     *
     * @param siteId   站点ID
     * @param bytes    文件字节数组
     * @param fileName 文件名
     * @return 文件访问URL
     */
    public String uploadFile(Long siteId, byte[] bytes, String fileName) {
        if (bytes == null || bytes.length == 0) {
            throw new ServiceException("文件内容不能为空");
        }

        try {
            CosClientWrapper wrapper = getCosClient(siteId);

            // 生成文件路径
            String filePath = generateFilePath(fileName);

            // 上传文件
            uploadFile(wrapper, new ByteArrayInputStream(bytes), filePath, null);

            // 返回访问URL
            return getFileUrl(wrapper.getConfig(), filePath);
        } catch (Exception e) {
            log.error("文件上传失败", e);
            throw new ServiceException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 上传文件到COS
     */
    private void uploadFile(CosClientWrapper wrapper, InputStream inputStream, String filePath, String contentType) {
        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentLength(inputStream.available());
            if (contentType != null && !contentType.isEmpty()) {
                metadata.setContentType(contentType);
            }

            PutObjectRequest putObjectRequest = new PutObjectRequest(
                    wrapper.getConfig().getBucket(),
                    filePath,
                    inputStream,
                    metadata
            );

            PutObjectResult result = wrapper.getClient().putObject(putObjectRequest);
            log.info("文件上传成功，ETag: {}, 路径: {}", result.getETag(), filePath);
        } catch (CosServiceException e) {
            log.error("COS服务异常: ErrorCode={}, ErrorMessage={}", e.getErrorCode(), e.getErrorMessage(), e);
            throw new ServiceException("文件上传失败: " + e.getErrorMessage());
        } catch (CosClientException | IOException e) {
            log.error("COS客户端异常", e);
            throw new ServiceException("文件上传失败: " + e.getMessage());
        }
    }

    /**
     * 删除文件
     *
     * @param siteId  站点ID
     * @param fileUrl 文件URL
     */
    public void deleteFile(Long siteId, String fileUrl) {
        try {
            CosClientWrapper wrapper = getCosClient(siteId);

            // 从URL中提取文件路径
            String filePath = extractFilePathFromUrl(wrapper.getConfig(), fileUrl);

            wrapper.getClient().deleteObject(wrapper.getConfig().getBucket(), filePath);
            log.info("文件删除成功，路径: {}", filePath);
        } catch (CosServiceException e) {
            log.error("COS服务异常: ErrorCode={}, ErrorMessage={}", e.getErrorCode(), e.getErrorMessage(), e);
            throw new ServiceException("文件删除失败: " + e.getErrorMessage());
        } catch (CosClientException e) {
            log.error("COS客户端异常", e);
            throw new ServiceException("文件删除失败: " + e.getMessage());
        }
    }

    /**
     * 检查文件是否存在
     *
     * @param siteId  站点ID
     * @param fileUrl 文件URL
     * @return 是否存在
     */
    public boolean fileExists(Long siteId, String fileUrl) {
        try {
            CosClientWrapper wrapper = getCosClient(siteId);
            String filePath = extractFilePathFromUrl(wrapper.getConfig(), fileUrl);
            return wrapper.getClient().doesObjectExist(wrapper.getConfig().getBucket(), filePath);
        } catch (Exception e) {
            log.error("检查文件存在性失败", e);
            return false;
        }
    }

    /**
     * 获取文件下载URL（带签名，用于私有读）
     *
     * @param siteId        站点ID
     * @param fileUrl       文件URL
     * @param expirationMin 过期时间（分钟）
     * @return 签名URL
     */
    public String getPresignedUrl(Long siteId, String fileUrl, int expirationMin) {
        try {
            CosClientWrapper wrapper = getCosClient(siteId);
            String filePath = extractFilePathFromUrl(wrapper.getConfig(), fileUrl);

            Date expirationDate = new Date(System.currentTimeMillis() + expirationMin * 60 * 1000L);
            GeneratePresignedUrlRequest request = new GeneratePresignedUrlRequest(
                    wrapper.getConfig().getBucket(),
                    filePath
            );
            request.setExpiration(expirationDate);

            return wrapper.getClient().generatePresignedUrl(request).toString();
        } catch (Exception e) {
            log.error("生成签名URL失败", e);
            throw new ServiceException("生成签名URL失败: " + e.getMessage());
        }
    }

    /**
     * 获取或创建COS客户端
     */
    private CosClientWrapper getCosClient(Long siteId) {
        return clientCache.computeIfAbsent(siteId, this::createCosClient);
    }

    /**
     * 创建COS客户端
     */
    private CosClientWrapper createCosClient(Long siteId) {
        SiteConfigProvider.CosConfig config = siteConfigProvider.getCosConfig(siteId);

        // 初始化用户身份信息
        COSCredentials cred = new BasicCOSCredentials(
                config.getSecretId(),
                config.getSecretKey()
        );

        // 设置 bucket 的地域
        Region region = new Region(config.getRegion());
        ClientConfig clientConfig = new ClientConfig(region);

        // 生成 cos 客户端
        COSClient client = new COSClient(cred, clientConfig);

        log.info("腾讯云COS客户端初始化成功，siteId: {}, Region: {}, Bucket: {}",
                siteId, config.getRegion(), config.getBucket());

        return new CosClientWrapper(client, config);
    }

    /**
     * 刷新站点COS客户端（配置更新后调用）
     */
    public void refreshClient(Long siteId) {
        CosClientWrapper oldWrapper = clientCache.remove(siteId);
        if (oldWrapper != null) {
            oldWrapper.getClient().shutdown();
            log.info("已关闭站点 {} 的COS客户端", siteId);
        }
    }

    /**
     * 生成文件路径
     * 格式: uploads/{yyyyMMdd}/{uuid}.{extension}
     */
    private String generateFilePath(String originalFilename) {
        // 获取文件扩展名
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }

        // 生成日期路径
        String datePath = DateUtil.format(new Date(), "yyyyMMdd");

        // 生成唯一文件名
        String fileName = IdUtil.fastSimpleUUID() + extension;

        // 组合完整路径
        return "uploads/" + datePath + "/" + fileName;
    }

    /**
     * 获取文件访问URL
     */
    private String getFileUrl(SiteConfigProvider.CosConfig config, String filePath) {
        return config.getBaseUrl() + "/" + filePath;
    }

    /**
     * 从URL中提取文件路径
     */
    private String extractFilePathFromUrl(SiteConfigProvider.CosConfig config, String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) {
            throw new ServiceException("文件URL不能为空");
        }

        String baseUrl = config.getBaseUrl();
        if (fileUrl.startsWith(baseUrl)) {
            return fileUrl.substring(baseUrl.length() + 1);
        }

        // 如果不是完整URL，直接返回
        return fileUrl;
    }

    /**
     * 应用关闭时释放资源
     */
    @PreDestroy
    public void destroy() {
        for (Map.Entry<Long, CosClientWrapper> entry : clientCache.entrySet()) {
            try {
                entry.getValue().getClient().shutdown();
                log.info("已关闭站点 {} 的COS客户端", entry.getKey());
            } catch (Exception e) {
                log.error("关闭站点 {} 的COS客户端失败: {}", entry.getKey(), e.getMessage());
            }
        }
        clientCache.clear();
        log.info("所有腾讯云COS客户端已关闭");
    }

    /**
     * COS客户端包装类
     */
    private static class CosClientWrapper {
        private final COSClient client;
        private final SiteConfigProvider.CosConfig config;

        public CosClientWrapper(COSClient client, SiteConfigProvider.CosConfig config) {
            this.client = client;
            this.config = config;
        }

        public COSClient getClient() {
            return client;
        }

        public SiteConfigProvider.CosConfig getConfig() {
            return config;
        }
    }
}
