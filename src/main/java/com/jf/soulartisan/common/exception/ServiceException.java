package com.jf.soulartisan.common.exception;

import lombok.Getter;

import java.io.Serial;

@Getter
public class ServiceException extends RuntimeException {
    @Serial
    private static final long serialVersionUID = 1L;

    private Integer code;

    private String message;

    public ServiceException() {
    }

    public ServiceException(String message) {
        this.message = message;
    }

    public ServiceException(String message, Integer code) {
        this.message = message;
        this.code = code;
    }
}
