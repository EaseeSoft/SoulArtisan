package com.jf.soulartisan.common.enums;

/**
 * 视频宽高比枚举
 */
public enum VideoAspectRatio {
    RATIO_16_9("16:9", "16:9 (横屏)"),
    RATIO_9_16("9:16", "9:16 (竖屏)");

    private final String value;
    private final String label;

    VideoAspectRatio(String value, String label) {
        this.value = value;
        this.label = label;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }
}
