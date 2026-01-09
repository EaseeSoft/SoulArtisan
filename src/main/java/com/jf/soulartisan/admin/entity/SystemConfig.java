package com.jf.soulartisan.admin.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.jf.soulartisan.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 系统配置表（全局配置，只有一条记录）
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("system_config")
public class SystemConfig extends BaseEntity {

    /**
     * 系统标题
     */
    private String systemTitle;

    /**
     * 系统Logo URL
     */
    private String systemLogo;

    /**
     * 系统Favicon URL
     */
    private String systemFavicon;

    /**
     * 版权信息
     */
    private String copyright;

    /**
     * 页脚文字
     */
    private String footerText;

    /**
     * ICP备案号
     */
    private String icpBeian;

    /**
     * 登录页背景图
     */
    private String loginBgImage;

    /**
     * 登录页标题
     */
    private String loginTitle;

    /**
     * 登录页副标题
     */
    private String loginSubtitle;

    /**
     * 主题色
     */
    private String primaryColor;

    /**
     * 图片生成并发任务数限制（0表示不限制）
     */
    private Integer imageConcurrencyLimit;

    /**
     * 视频生成并发任务数限制（0表示不限制）
     */
    private Integer videoConcurrencyLimit;
}
