package com.jf.soulartisan.common.exception;

import cn.dev33.satoken.exception.NotLoginException;
import cn.dev33.satoken.exception.NotPermissionException;
import cn.dev33.satoken.exception.NotRoleException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.servlet.NoHandlerFoundException;

import java.nio.file.AccessDeniedException;
import java.util.Set;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ServiceException.class)
    public Object handleServiceException(ServiceException e) {
        log.error(e.getMessage(), e);
        return error(500, e.getMessage());
    }

    @ExceptionHandler(NoHandlerFoundException.class)
    public Object handleResourceNotFoundException(NoHandlerFoundException e, HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        log.warn("请求地址'{}',资源未找到'{}'", requestURI, e.getMessage());
        return error(404, "资源未找到");
    }

    @ExceptionHandler(NotLoginException.class)
    public Object handleNotLoginException(NotLoginException nle, HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        log.info("请求地址'{}',认证失败'{}',无法访问系统资源", requestURI, nle.getMessage());
        return error(401, "认证失败，无法访问系统资源");
    }

    @ExceptionHandler(NotRoleException.class)
    public Object handleNotRoleException(NotRoleException e, HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',角色权限校验不通过'{}'", requestURI, e.getMessage());
        return error(403, "没有访问权限，请联系管理员授权");
    }

    @ExceptionHandler(NotPermissionException.class)
    public Object handleNotPermissionException(NotPermissionException e, HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',权限码校验不通过'{}'", requestURI, e.getMessage());
        return error(403, "没有访问权限，请联系管理员授权");
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public Object handleHttpRequestMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.error("请求方法不支持：{}", e.getMessage(), e);
        return error(405, "请求方法不支持");
    }

    @ExceptionHandler(RuntimeException.class)
    public Object handleRuntimeException(RuntimeException e, HttpServletRequest request) {
        String requestURI = request.getRequestURI();
        log.error("请求地址'{}',发生未知异常.", requestURI, e);
        return error(500, e.getMessage());
    }

    @ExceptionHandler(Exception.class)
    public Object handleException(Exception e, HttpServletRequest request) {
        log.error("系统异常：{}", e.getMessage(), e);
        String requestURI = request.getRequestURI();
        String message = String.format("请求地址'%s'发生异常，请联系管理员", requestURI);
        return error(500, message);
    }

    @ExceptionHandler(BindException.class)
    public Object handleBindException(BindException e) {
        log.error("参数绑定异常：{}", e.getMessage(), e);
        String message = e.getBindingResult().getFieldError().getDefaultMessage();
        return error(400, message);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Object handleMethodArgumentNotValidException(MethodArgumentNotValidException e) {
        log.error("参数校验异常：{}", e.getMessage(), e);
        String message = e.getBindingResult().getFieldError().getDefaultMessage();
        return error(400, message);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public Object handleAccessDeniedException(AccessDeniedException e) {
        log.error("权限异常：{}", e.getMessage(), e);
        return error(403, "没有权限，请联系管理员");
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public Object handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException e) {
        log.error("参数类型不匹配：{}", e.getMessage(), e);
        return error(400, "参数类型不匹配");
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public Object handleMissingServletRequestParameterException(MissingServletRequestParameterException e) {
        log.error("缺少请求参数：{}", e.getMessage(), e);
        return error(400, "缺少请求参数");
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public Object handleConstraintViolationException(ConstraintViolationException e) {
        log.error("约束违反异常：{}", e.getMessage(), e);
        Set<ConstraintViolation<?>> violations = e.getConstraintViolations();
        String message = violations.stream()
                .map(ConstraintViolation::getMessage)
                .findFirst()
                .orElse("参数校验失败");
        return error(400, message);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public Object handleMaxUploadSizeExceededException(MaxUploadSizeExceededException e) {
        log.error("文件上传大小限制：{}", e.getMessage(), e);
        return error(400, "文件大小超出限制");
    }

    private Object error(int code, String message) {
        return new ErrorResponse(code, message);
    }

    private static class ErrorResponse {
        public int code;
        public String message;

        public ErrorResponse(int code, String message) {
            this.code = code;
            this.message = message;
        }
    }
}
