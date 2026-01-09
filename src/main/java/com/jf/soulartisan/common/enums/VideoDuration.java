package com.jf.soulartisan.common.enums;

/**
 * 视频时长枚举(秒)
 */
public enum VideoDuration {
    DURATION_10(10, "10秒"),
    DURATION_15(15, "15秒");

    private final Integer value;
    private final String label;

    VideoDuration(Integer value, String label) {
        this.value = value;
        this.label = label;
    }

    public Integer getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }
}
