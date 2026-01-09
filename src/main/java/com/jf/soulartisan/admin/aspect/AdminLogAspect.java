package com.jf.soulartisan.admin.aspect;

import cn.hutool.json.JSONUtil;
import com.jf.soulartisan.admin.annotation.AdminLog;
import com.jf.soulartisan.admin.context.SiteContext;
import com.jf.soulartisan.admin.entity.AdminOperationLog;
import com.jf.soulartisan.admin.entity.AdminUser;
import com.jf.soulartisan.admin.mapper.AdminOperationLogMapper;
import com.jf.soulartisan.admin.mapper.AdminUserMapper;
import com.jf.soulartisan.common.security.SecurityUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;

/**
 * 管理员操作日志切面
 * 记录管理员的操作日志
 */
@Slf4j
@Aspect
@Component
public class AdminLogAspect {

    @Autowired
    private AdminOperationLogMapper operationLogMapper;

    @Autowired
    private AdminUserMapper adminUserMapper;

    @Around("@annotation(com.jf.soulartisan.admin.annotation.AdminLog)")
    public Object recordLog(ProceedingJoinPoint joinPoint) throws Throwable {
        // 获取注解信息
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        AdminLog adminLog = method.getAnnotation(AdminLog.class);

        // 获取请求信息
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes != null ? attributes.getRequest() : null;

        // 创建操作日志对象
        AdminOperationLog operationLog = new AdminOperationLog();
        operationLog.setModule(adminLog.module());
        operationLog.setOperation(adminLog.operation());

        // 设置请求信息
        if (request != null) {
            operationLog.setMethod(request.getMethod() + " " + request.getRequestURI());
            operationLog.setIp(getClientIp(request));
            operationLog.setUserAgent(request.getHeader("User-Agent"));
        }

        // 设置管理员信息
        try {
            if (SecurityUtils.isAdminLogin()) {
                Long adminId = SecurityUtils.getAdminLoginUserId();
                operationLog.setAdminId(adminId);

                AdminUser adminUser = adminUserMapper.selectById(adminId);
                if (adminUser != null) {
                    operationLog.setAdminName(adminUser.getUsername());
                }

                // 设置站点ID
                if (SiteContext.hasSiteId()) {
                    operationLog.setSiteId(SiteContext.getSiteId());
                }
            }
        } catch (Exception e) {
            log.error("获取管理员信息失败", e);
        }

        // 设置请求参数
        try {
            Object[] args = joinPoint.getArgs();
            if (args != null && args.length > 0) {
                String params = JSONUtil.toJsonStr(args);
                // 限制参数长度，避免过长
                if (params.length() > 2000) {
                    params = params.substring(0, 2000) + "...";
                }
                operationLog.setParams(params);
            }
        } catch (Exception e) {
            log.error("记录请求参数失败", e);
        }

        // 记录开始时间
        long startTime = System.currentTimeMillis();

        Object result = null;
        try {
            // 执行目标方法
            result = joinPoint.proceed();

            // 操作成功
            operationLog.setStatus(AdminOperationLog.Status.SUCCESS);

            // 记录返回结果
            try {
                String resultStr = JSONUtil.toJsonStr(result);
                if (resultStr.length() > 2000) {
                    resultStr = resultStr.substring(0, 2000) + "...";
                }
                operationLog.setResult(resultStr);
            } catch (Exception e) {
                log.error("记录返回结果失败", e);
            }

            return result;
        } catch (Throwable throwable) {
            // 操作失败
            operationLog.setStatus(AdminOperationLog.Status.FAILED);
            operationLog.setErrorMsg(throwable.getMessage());
            throw throwable;
        } finally {
            // 计算耗时
            long costTime = System.currentTimeMillis() - startTime;
            operationLog.setCostTime((int) costTime);

            // 保存日志（异步保存，避免影响主流程）
            try {
                operationLogMapper.insert(operationLog);
            } catch (Exception e) {
                log.error("保存操作日志失败", e);
            }
        }
    }

    /**
     * 获取客户端真实IP
     */
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        // 处理多个代理的情况，取第一个IP
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }
}
