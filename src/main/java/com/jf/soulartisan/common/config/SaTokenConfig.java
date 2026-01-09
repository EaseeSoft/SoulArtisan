package com.jf.soulartisan.common.config;

import cn.dev33.satoken.interceptor.SaInterceptor;
import cn.dev33.satoken.jwt.StpLogicJwtForSimple;
import cn.dev33.satoken.stp.StpLogic;
import cn.dev33.satoken.strategy.SaAnnotationStrategy;
import com.jf.soulartisan.admin.interceptor.SiteContextInterceptor;
import com.jf.soulartisan.common.security.StpKit;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@Slf4j
public class SaTokenConfig implements WebMvcConfigurer {

    @Autowired
    private SiteContextInterceptor siteContextInterceptor;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 1. Sa-Token 注解拦截器 - order=0，优先执行认证
        // 使用 SaInterceptor 的注解鉴权模式
        registry.addInterceptor(new SaInterceptor(handle -> {
                    // 什么都不做，只让 Sa-Token 处理注解
                }))
                .addPathPatterns("/**")
                .excludePathPatterns(
                        "/doc.html",
                        "/swagger-ui.html",
                        "/swagger-ui/**",
                        "/v3/api-docs/**",
                        "/swagger-resources/**",
                        "/webjars/**",
                        "/favicon.ico",
                        "/error"
                )
                .order(0);
        log.info("✅ Sa-Token 拦截器注册完成 - order=0");

        // 2. 站点上下文拦截器 - order=10，在认证之后执行
        registry.addInterceptor(siteContextInterceptor)
                .addPathPatterns("/admin/**")
                .order(10);
        log.info("✅ 站点上下文拦截器注册完成 - order=10, pattern=/admin/**");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
        log.info("✅ CORS 配置完成");
    }

    @Bean
    public StpLogic getStpLogicJwt() {
        return new StpLogicJwtForSimple();
    }

    @PostConstruct
    public void rewriteSaStrategy() {
        SaAnnotationStrategy.instance.getAnnotation = AnnotatedElementUtils::getMergedAnnotation;
        log.info("✅ Sa-Token 注解策略配置完成");
    }

    @PostConstruct
    public void registerStp() {
        StpLogic adminStp = StpKit.ADMIN;
        StpLogic userStp = StpKit.USER;
        log.info("✅ Sa-Token StpLogic 注册完成 - Admin: {}, User: {}",
                adminStp.getLoginType(), userStp.getLoginType());
    }
}