package com.jf.soulartisan.admin.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 配置加密工具类
 * 用于加密/解密敏感配置信息（API Key、密钥等）
 */
@Slf4j
@Component
public class EncryptUtil {

    /**
     * 加密算法
     */
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String KEY_ALGORITHM = "AES";

    /**
     * 加密密钥（从配置文件读取，16字节）
     */
    @Value("${admin.config.encrypt.key:AgentVideoSecret}")
    private String secretKey;

    /**
     * 初始化向量（16字节）
     */
    @Value("${admin.config.encrypt.iv:1234567890123456}")
    private String iv;

    /**
     * 加密字符串
     *
     * @param plainText 明文
     * @return 密文（Base64编码）
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }

        try {
            // 创建密钥和向量
            SecretKeySpec keySpec = new SecretKeySpec(getKeyBytes(), KEY_ALGORITHM);
            IvParameterSpec ivSpec = new IvParameterSpec(getIvBytes());

            // 创建加密器
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, ivSpec);

            // 加密并转为Base64
            byte[] encrypted = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encrypted);

        } catch (Exception e) {
            log.error("加密失败: {}", e.getMessage(), e);
            throw new RuntimeException("配置加密失败", e);
        }
    }

    /**
     * 解密字符串
     *
     * @param cipherText 密文（Base64编码）
     * @return 明文
     */
    public String decrypt(String cipherText) {
        if (cipherText == null || cipherText.isEmpty()) {
            return cipherText;
        }

        try {
            // 创建密钥和向量
            SecretKeySpec keySpec = new SecretKeySpec(getKeyBytes(), KEY_ALGORITHM);
            IvParameterSpec ivSpec = new IvParameterSpec(getIvBytes());

            // 创建解密器
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, ivSpec);

            // Base64解码并解密
            byte[] decoded = Base64.getDecoder().decode(cipherText);
            byte[] decrypted = cipher.doFinal(decoded);
            return new String(decrypted, StandardCharsets.UTF_8);

        } catch (Exception e) {
            log.error("解密失败: {}", e.getMessage(), e);
            throw new RuntimeException("配置解密失败", e);
        }
    }

    /**
     * 脱敏显示（保留前后各4个字符，中间用***代替）
     *
     * @param text 原文
     * @return 脱敏后的文本
     */
    public String maskForDisplay(String text) {
        if (text == null || text.isEmpty()) {
            return text;
        }

        int length = text.length();
        if (length <= 8) {
            // 长度小于等于8，只显示前2位
            return text.substring(0, Math.min(2, length)) + "***";
        }

        // 保留前4位和后4位
        return text.substring(0, 4) + "***" + text.substring(length - 4);
    }

    /**
     * 获取密钥字节（确保16字节）
     */
    private byte[] getKeyBytes() {
        byte[] keyBytes = secretKey.getBytes(StandardCharsets.UTF_8);
        byte[] result = new byte[16];
        System.arraycopy(keyBytes, 0, result, 0, Math.min(keyBytes.length, 16));
        return result;
    }

    /**
     * 获取IV字节（确保16字节）
     */
    private byte[] getIvBytes() {
        byte[] ivBytes = iv.getBytes(StandardCharsets.UTF_8);
        byte[] result = new byte[16];
        System.arraycopy(ivBytes, 0, result, 0, Math.min(ivBytes.length, 16));
        return result;
    }
}
