package com.jf.soulartisan.controller;

import com.jf.soulartisan.common.enums.*;
import com.jf.soulartisan.common.util.Result;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 枚举配置接口
 */
@RestController
@RequestMapping("/enums")
public class EnumController {

    /**
     * 获取所有枚举配置
     */
    @GetMapping("/all")
    public Result<Map<String, List<Map<String, Object>>>> getAllEnums() {
        Map<String, List<Map<String, Object>>> enums = new HashMap<>();

        // 图片相关枚举
        enums.put("imageModels", convertEnumToList(ImageModel.values()));
        enums.put("imageAspectRatios", convertEnumToList(ImageAspectRatio.values()));
        enums.put("imageSizes", convertEnumToList(ImageSize.values()));

        // 视频相关枚举
        enums.put("videoModels", convertEnumToList(VideoModel.values()));
        enums.put("videoAspectRatios", convertEnumToList(VideoAspectRatio.values()));
        enums.put("videoDurations", convertVideoDurationToList(VideoDuration.values()));

        // 通用风格枚举(包含prompt)
        enums.put("styles", convertStyleEnumToList(GenerationStyle.values()));

        return Result.success(enums);
    }

    /**
     * 获取图片相关枚举
     */
    @GetMapping("/image")
    public Result<Map<String, List<Map<String, Object>>>> getImageEnums() {
        Map<String, List<Map<String, Object>>> enums = new HashMap<>();

        enums.put("models", convertEnumToList(ImageModel.values()));
        enums.put("aspectRatios", convertEnumToList(ImageAspectRatio.values()));
        enums.put("sizes", convertEnumToList(ImageSize.values()));
        enums.put("styles", convertStyleEnumToList(GenerationStyle.values()));

        return Result.success(enums);
    }

    /**
     * 获取视频相关枚举
     */
    @GetMapping("/video")
    public Result<Map<String, List<Map<String, Object>>>> getVideoEnums() {
        Map<String, List<Map<String, Object>>> enums = new HashMap<>();

        enums.put("models", convertEnumToList(VideoModel.values()));
        enums.put("aspectRatios", convertEnumToList(VideoAspectRatio.values()));
        enums.put("durations", convertVideoDurationToList(VideoDuration.values()));
        enums.put("styles", convertStyleEnumToList(GenerationStyle.values()));

        return Result.success(enums);
    }

    /**
     * 获取角色相关枚举
     */
    @GetMapping("/character")
    public Result<Map<String, List<Map<String, Object>>>> getCharacterEnums() {
        Map<String, List<Map<String, Object>>> enums = new HashMap<>();

        enums.put("aspectRatios", convertEnumToList(VideoAspectRatio.values()));
        enums.put("durations", convertVideoDurationToList(VideoDuration.values()));
        enums.put("styles", convertStyleEnumToList(GenerationStyle.values()));

        return Result.success(enums);
    }

    /**
     * 获取风格枚举
     */
    @GetMapping("/styles")
    public Result<List<Map<String, Object>>> getStyles() {
        return Result.success(convertStyleEnumToList(GenerationStyle.values()));
    }

    /**
     * 转换普通枚举为列表
     */
    private <T> List<Map<String, Object>> convertEnumToList(T[] enumValues) {
        return Arrays.stream(enumValues)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    try {
                        map.put("value", e.getClass().getMethod("getValue").invoke(e));
                        map.put("label", e.getClass().getMethod("getLabel").invoke(e));
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * 转换视频时长枚举为列表(特殊处理Integer类型的value)
     */
    private List<Map<String, Object>> convertVideoDurationToList(VideoDuration[] enumValues) {
        return Arrays.stream(enumValues)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("value", e.getValue());
                    map.put("label", e.getLabel());
                    return map;
                })
                .collect(Collectors.toList());
    }

    /**
     * 转换风格枚举为列表(包含prompt字段)
     */
    private List<Map<String, Object>> convertStyleEnumToList(GenerationStyle[] enumValues) {
        return Arrays.stream(enumValues)
                .map(e -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("value", e.getValue());
                    map.put("label", e.getLabel());
                    map.put("prompt", e.getPrompt());
                    return map;
                })
                .collect(Collectors.toList());
    }
}
