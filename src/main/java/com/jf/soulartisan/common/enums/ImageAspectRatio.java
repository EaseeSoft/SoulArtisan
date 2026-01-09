package com.jf.soulartisan.common.enums;

/**
 * 图片宽高比枚举
 */
public enum ImageAspectRatio {
    AUTO("auto", "自适应"),
    RATIO_1_1("1:1", "1:1 (正方形)"),
    RATIO_2_3("2:3", "2:3"),
    RATIO_3_2("3:2", "3:2"),
    RATIO_3_4("3:4", "3:4"),
    RATIO_4_3("4:3", "4:3"),
    RATIO_4_5("4:5", "4:5"),
    RATIO_5_4("5:4", "5:4"),
    RATIO_9_16("9:16", "9:16 (竖向)"),
    RATIO_16_9("16:9", "16:9 (横向)"),
    RATIO_21_9("21:9", "21:9 (超宽)");

    private final String value;
    private final String label;

    ImageAspectRatio(String value, String label) {
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
