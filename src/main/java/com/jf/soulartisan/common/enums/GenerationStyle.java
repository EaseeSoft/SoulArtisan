package com.jf.soulartisan.common.enums;

/**
 * 生成风格枚举(图片和视频共用)
 * 主要面向动漫、漫剧类创作
 */
public enum GenerationStyle {
    NONE("", "无特定风格", ""),

    // 日系动漫风格
    JAPANESE_ANIME("japanese_anime", "日式动漫 (标准二次元)", "Japanese anime style, standard 2D animation, clean lines, expressive characters"),
    GHIBLI("ghibli", "吉卜力风格 (宫崎骏手绘感)", "Studio Ghibli style, Hayao Miyazaki hand-drawn aesthetic, soft colors, detailed backgrounds"),
    SHINKAI("shinkai", "新海诚风格 (高光感/唯美风景)", "Makoto Shinkai style, high contrast lighting, beautiful scenery, photorealistic backgrounds"),
    SHONEN("shonen", "热血少年漫 (火影/海贼王)", "Shonen manga style, dynamic action poses, bold lines, intense expressions"),
    SHOUJO("shoujo", "少女漫画 (浪漫/梦幻)", "Shoujo manga style, romantic, sparkly effects, delicate features, soft lighting"),
    CHIBI("chibi", "Q版萌系 (可爱头身比)", "Chibi style, cute deformed proportions, big head, small body, kawaii aesthetic"),

    // 国漫与韩漫风格
    MANHUA("manhua", "国漫风格 (中国网络漫画)", "Chinese manhua style, modern comic art, vibrant colors, dynamic composition"),
    MANHWA("manhwa", "韩漫风格 (韩国网漫)", "Korean manhwa style, webtoon aesthetic, vertical scroll format, soft shading"),
    CHINESE_ANCIENT("chinese_ancient", "中国古风 (武侠/仙侠)", "Chinese ancient style, wuxia, xianxia, traditional clothing, ink painting influence"),
    INK_WASH("ink_wash", "水墨风格 (传统国风动画)", "Chinese ink wash painting style, traditional animation, flowing brushstrokes"),

    // 3D与特殊动画风格
    ANIME_3D("3d_anime", "3D动漫 (皮克斯/迪士尼)", "3D animated style, Pixar Disney style, smooth rendering, expressive characters"),
    ANIME_REALISTIC("anime_realistic", "写实动漫 (半写实二次元)", "Semi-realistic anime style, detailed features, realistic proportions with anime aesthetics"),

    // 场景氛围风格
    CYBERPUNK("cyberpunk", "赛博朋克 (霓虹/科幻)", "Cyberpunk style, neon lights, high-tech, dark urban atmosphere, futuristic"),
    FANTASY("fantasy", "奇幻风格 (魔法/异世界)", "Fantasy style, magical atmosphere, mystical creatures, epic landscapes");

    private final String value;
    private final String label;
    private final String prompt;

    GenerationStyle(String value, String label, String prompt) {
        this.value = value;
        this.label = label;
        this.prompt = prompt;
    }

    public String getValue() {
        return value;
    }

    public String getLabel() {
        return label;
    }

    public String getPrompt() {
        return prompt;
    }
}
