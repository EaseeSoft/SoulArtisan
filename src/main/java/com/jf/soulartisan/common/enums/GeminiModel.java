package com.jf.soulartisan.common.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum GeminiModel {
    GEMINI_3_PRO_PREVIEW("gemini-3-pro-preview", "Gemini 3 Pro Preview");

    final String value;
    final String label;
}
