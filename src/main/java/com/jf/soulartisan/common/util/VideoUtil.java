package com.jf.soulartisan.common.util;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Slf4j
public class VideoUtil {

    /**
     * 使用 FFmpeg 命令行提取视频第一帧
     *
     * @param videoUrl 视频 URL
     * @return 第一帧图片的字节数组（JPEG 格式）
     * @throws Exception 提取失败
     */
    public static byte[] extractFirstFrame(String videoUrl) throws Exception {
        Path tempVideoFile = null;
        Path tempImageFile = null;

        try {
            // 创建临时文件
            String tempDir = System.getProperty("java.io.tmpdir");
            String videoSuffix = getFileSuffix(videoUrl, ".mp4");
            tempVideoFile = Files.createTempFile(Paths.get(tempDir), "video", videoSuffix);
            tempImageFile = Files.createTempFile(Paths.get(tempDir), "frame", ".jpg");

            // 下载视频到临时文件
            log.info("下载视频到临时文件: {}", tempVideoFile);
            try (InputStream in = new java.net.URL(videoUrl).openStream()) {
                Files.copy(in, tempVideoFile, StandardCopyOption.REPLACE_EXISTING);
            }

            // 构建 FFmpeg 命令
            // -i: 输入文件
            // -ss 0: 从第0秒开始
            // -vframes 1: 只提取1帧
            // -q:v 2: JPEG 质量（2是高质量，范围1-31）
            String ffmpegCmd = determineFfmpegCommand();
            ProcessBuilder pb = new ProcessBuilder(
                    ffmpegCmd,
                    "-i", tempVideoFile.toString(),
                    "-ss", "0",
                    "-vframes", "1",
                    "-q:v", "2",
                    "-y",  // 覆盖输出文件
                    tempImageFile.toString()
            );
            pb.redirectErrorStream(true);

            log.info("执行 FFmpeg 命令: {}", String.join(" ", pb.command()));
            Process process = pb.start();

            // 读取命令输出用于日志
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new java.io.InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }
            }

            int exitCode = process.waitFor();
            if (exitCode != 0) {
                log.error("FFmpeg 执行失败，退出码: {}, 输出: {}", exitCode, output);
                throw new RuntimeException("FFmpeg 提取视频帧失败，退出码: " + exitCode);
            }

            // 检查输出文件是否存在
            if (!Files.exists(tempImageFile) || Files.size(tempImageFile) == 0) {
                throw new RuntimeException("FFmpeg 未生成图片文件");
            }

            // 读取图片文件
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Files.copy(tempImageFile, baos);
            byte[] result = baos.toByteArray();

            log.info("成功提取视频第一帧，大小: {} 字节", result.length);
            return result;

        } finally {
            // 清理临时文件
            if (tempVideoFile != null) {
                try {
                    Files.deleteIfExists(tempVideoFile);
                } catch (Exception e) {
                    log.warn("删除临时视频文件失败: {}", e.getMessage());
                }
            }
            if (tempImageFile != null) {
                try {
                    Files.deleteIfExists(tempImageFile);
                } catch (Exception e) {
                    log.warn("删除临时图片文件失败: {}", e.getMessage());
                }
            }
        }
    }

    /**
     * 确定 FFmpeg 命令
     */
    private static String determineFfmpegCommand() {
        return "ffmpeg";
    }

    /**
     * 从 URL 获取文件后缀
     */
    private static String getFileSuffix(String url, String defaultSuffix) {
        try {
            java.net.URL urlObj = new java.net.URL(url);
            String path = urlObj.getPath();
            int lastDot = path.lastIndexOf('.');
            if (lastDot > 0 && lastDot < path.length() - 1) {
                return path.substring(lastDot);
            }
        } catch (Exception e) {
            // 忽略异常，使用默认后缀
        }
        return defaultSuffix;
    }
}
