package com.jf.soulartisan.common.enums;

/**
 * 图片生成模型枚举
 */
public enum ImageModel {
    NANO_BANANA_PRO("gemini-3-pro-image-preview", "Nano-Banana Pro"),
    NANO_BANANA("gemini-2.5-pro-image-preview", "Nano-Banana");

    private final String value;
    private final String label;

    ImageModel(String value, String label) {
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
