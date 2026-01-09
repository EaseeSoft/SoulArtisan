package com.jf.soulartisan.common.util;

import lombok.Data;

@Data
public class Result<T> {

    private Integer code;
    private String msg;
    private T data;

    public static <T> Result<T> success(T data) {
        return success(data, "success");
    }

    public static <T> Result<T> success(T data, String message) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg(message);
        result.setData(data);
        return result;
    }

    public static <T> Result<T> error(String message) {
        return error(message, 400);
    }

    public static <T> Result<T> error(String message, Integer code) {
        Result<T> result = new Result<>();
        result.setCode(code);
        result.setMsg(message);
        result.setData(null);
        return result;
    }

    public static <T> Result<T> unauthorized(String message) {
        return error(message, 401);
    }

    public static <T> Result<T> forbidden(String message) {
        return error(message, 403);
    }

    public static <T> Result<T> internalError(String message) {
        return error(message, 500);
    }
}
