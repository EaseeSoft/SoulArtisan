package com.jf.soulartisan.controller;

import com.jf.soulartisan.admin.entity.Site;
import com.jf.soulartisan.admin.mapper.SiteMapper;
import com.jf.soulartisan.common.config.SystemProperties;
import com.jf.soulartisan.common.dto.LoginRequest;
import com.jf.soulartisan.common.dto.RegisterRequest;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/auth")
@Tag(name = "认证接口")
public class AuthController {

    @Resource
    private UserService userService;

    @Resource
    private SystemProperties systemProperties;

    @Resource
    private SiteMapper siteMapper;

    @PostMapping("/login")
    @Operation(summary = "用户登录")
    public Result<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        // 根据域名查询站点ID
        Long siteId = getSiteIdFromRequest(httpRequest);

        Map<String, Object> result = userService.login(request.getUsername(), request.getPassword(), siteId);

        if (result == null) {
            return Result.error("用户名或密码错误", 401);
        }

        return Result.success(result, "登录成功");
    }

    @PostMapping("/register")
    @Operation(summary = "用户注册")
    public Result<?> register(@Valid @RequestBody RegisterRequest request, HttpServletRequest httpRequest) {
        if (!systemProperties.getEnableRegister()) {
            return Result.error("注册功能已关闭", 403);
        }

        // 根据域名查询站点ID
        Long siteId = getSiteIdFromRequest(httpRequest);

        Map<String, Object> result = userService.register(
                request.getUsername(),
                request.getPassword(),
                request.getEmail(),
                request.getNickname(),
                request.getPhone(),
                siteId
        );

        if (result == null) {
            return Result.error("用户名已存在或注册失败", 400);
        }

        return Result.success(result, "注册成功");
    }

    @GetMapping("/token-info")
    @Operation(summary = "获取Token信息")
    @SaUserCheckLogin
    public Result<?> getTokenInfo() {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Map<String, Object> tokenInfo = new HashMap<>();
        tokenInfo.put("user_id", userId);
        tokenInfo.put("token", StpKit.USER.getTokenValue());
        tokenInfo.put("login_device", StpKit.USER.getLoginDevice());
        tokenInfo.put("token_timeout", StpKit.USER.getTokenTimeout());

        return Result.success(tokenInfo, "获取成功");
    }

    @PostMapping("/logout")
    @Operation(summary = "退出登录")
    @SaUserCheckLogin
    public Result<?> logout() {
        Long userId = StpKit.USER.getLoginIdAsLong();
        SecurityUtils.userLogout(userId);

        return Result.success(null, "退出成功");
    }

    @GetMapping("/system-config")
    @Operation(summary = "获取系统配置")
    public Result<?> getSystemConfig() {
        Map<String, Object> config = new HashMap<>();
        config.put("enableRegister", systemProperties.getEnableRegister());

        return Result.success(config, "获取成功");
    }

    /**
     * 从请求中获取站点ID
     */
    private Long getSiteIdFromRequest(HttpServletRequest request) {
        String domain = request.getServerName();
        log.info("请求域名: {}", domain);

        Site site = siteMapper.selectByDomain(domain);
        if (site != null) {
            log.info("查询到站点ID: {}, 站点名称: {}", site.getId(), site.getSiteName());
            return site.getId();
        }

        log.warn("未找到域名 {} 对应的站点", domain);
        return null;
    }
}