package com.jf.soulartisan.common.enums;

/**
 * 图片分辨率枚举(仅gemini-3-pro-image-preview支持)
 */
public enum ImageSize {
    SIZE_1K("1K", "1K (快速)"),
    SIZE_2K("2K", "2K (标准)"),
    SIZE_4K("4K", "4K (高质量)");

    private final String value;
    private final String label;

    ImageSize(String value, String label) {
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
