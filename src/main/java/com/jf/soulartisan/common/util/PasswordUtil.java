package com.jf.soulartisan.common.util;

import cn.hutool.crypto.digest.BCrypt;

public class PasswordUtil {

    public static String encode(String password) {
        return BCrypt.hashpw(password);
    }

    public static boolean matches(String rawPassword, String encodedPassword) {
        return BCrypt.checkpw(rawPassword, encodedPassword);
    }

    public static String hash(String password) {
        return BCrypt.hashpw(password);
    }

    public static boolean verify(String password, String hash) {
        return BCrypt.checkpw(password, hash);
    }

    public static boolean needsRehash(String hash) {
        return false;
    }
}