package com.jf.soulartisan.common.enums;

/**
 * 视频生成模型枚举
 */
public enum VideoModel {
    SORA_2("sora-2", "Sora-2 (标准版)"),
    SORA_2_PRO("sora-2-pro", "Sora-2-Pro (专业版)");

    private final String value;
    private final String label;

    VideoModel(String value, String label) {
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
