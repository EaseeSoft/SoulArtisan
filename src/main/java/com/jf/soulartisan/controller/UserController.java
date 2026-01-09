package com.jf.soulartisan.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.admin.entity.PointsRecord;
import com.jf.soulartisan.admin.service.CardKeyService;
import com.jf.soulartisan.admin.service.PointsRecordService;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.dto.UserPasswordUpdateRequest;
import com.jf.soulartisan.common.dto.UserUpdateRequest;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.security.annotation.SaUserCheckLogin;
import com.jf.soulartisan.common.util.Result;
import com.jf.soulartisan.entity.User;
import com.jf.soulartisan.mapper.UserMapper;
import com.jf.soulartisan.service.AttachmentService;
import com.jf.soulartisan.service.CosService;
import com.jf.soulartisan.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 用户控制器
 * 提供用户端的个人信息、积分查询和卡密充值功能
 */
@Slf4j
@RestController
@RequestMapping("/user")
@Tag(name = "用户接口", description = "用户端的个人信息、积分和卡密相关接口")
@SaUserCheckLogin
@RequiredArgsConstructor
public class UserController {

    private final UserMapper userMapper;
    private final PointsRecordService pointsRecordService;
    private final CardKeyService cardKeyService;
    private final UserService userService;
    private final CosService cosService;
    private final AttachmentService attachmentService;

    /**
     * 获取当前用户信息
     */
    @Operation(summary = "获取当前用户信息", description = "获取当前登录用户的详细信息")
    @GetMapping("/info")
    public Result<?> getUserInfo() {
        Long userId = StpKit.USER.getLoginIdAsLong();
        User user = userMapper.selectById(userId);

        if (user == null) {
            return Result.error("用户不存在", 404);
        }

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("user_id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("email", user.getEmail());
        userInfo.put("phone", user.getPhone());
        userInfo.put("avatar", user.getAvatar());
        userInfo.put("points", user.getPoints());
        userInfo.put("role", user.getRole());

        return Result.success(userInfo, "获取成功");
    }

    /**
     * 更新用户信息
     */
    @Operation(summary = "更新用户信息", description = "更新当前登录用户的昵称、邮箱、手机号")
    @PostMapping("/update")
    public Result<?> updateUserInfo(@Valid @RequestBody UserUpdateRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        try {
            User updatedUser = userService.updateUserInfo(userId, request);

            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("user_id", updatedUser.getId());
            userInfo.put("username", updatedUser.getUsername());
            userInfo.put("nickname", updatedUser.getNickname());
            userInfo.put("email", updatedUser.getEmail());
            userInfo.put("phone", updatedUser.getPhone());
            userInfo.put("avatar", updatedUser.getAvatar());
            userInfo.put("points", updatedUser.getPoints());
            userInfo.put("role", updatedUser.getRole());

            return Result.success(userInfo, "更新成功");
        } catch (Exception e) {
            log.error("更新用户信息失败: userId={}, error={}", userId, e.getMessage());
            return Result.error(e.getMessage(), 400);
        }
    }

    /**
     * 修改密码
     */
    @Operation(summary = "修改密码", description = "修改当前登录用户的密码")
    @PostMapping("/password")
    public Result<?> updatePassword(@Valid @RequestBody UserPasswordUpdateRequest request) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        try {
            boolean success = userService.updatePassword(userId, request.getOldPassword(), request.getNewPassword());
            if (!success) {
                return Result.error("原密码错误", 400);
            }
            return Result.success(Map.of("message", "密码修改成功"), "修改成功");
        } catch (Exception e) {
            log.error("修改密码失败: userId={}, error={}", userId, e.getMessage());
            return Result.error(e.getMessage(), 400);
        }
    }

    /**
     * 上传头像
     */
    @Operation(summary = "上传头像", description = "上传用户头像")
    @PostMapping("/avatar")
    public Result<?> uploadAvatar(
            @Parameter(description = "头像文件", required = true)
            @RequestParam("avatar") MultipartFile file) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        User user = userMapper.selectById(userId);

        if (user == null) {
            return Result.error("用户不存在", 404);
        }

        if (user.getSiteId() == null) {
            return Result.error("用户站点信息不存在", 400);
        }

        try {
            // 验证文件类型
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                return Result.error("只支持图片文件", 400);
            }

            // 验证文件大小（2MB）
            if (file.getSize() > 2 * 1024 * 1024) {
                return Result.error("图片大小不能超过2MB", 400);
            }

            // 上传文件到COS
            String fileUrl = cosService.uploadFile(user.getSiteId(), file);

            // 更新用户头像
            userService.updateAvatar(userId, fileUrl);

            Map<String, Object> result = new HashMap<>();
            result.put("avatar", fileUrl);

            log.info("用户头像上传成功: userId={}, avatarUrl={}", userId, fileUrl);
            return Result.success(result, "上传成功");
        } catch (Exception e) {
            log.error("上传头像失败: userId={}, error={}", userId, e.getMessage());
            return Result.error("上传失败: " + e.getMessage(), 500);
        }
    }

    /**
     * 获取用户积分记录
     */
    @Operation(summary = "获取积分记录", description = "分页获取当前用户的积分变动记录")
    @GetMapping("/points/records")
    public Result<PageResult<PointsRecord>> getPointsRecords(
            @Parameter(description = "页码") @RequestParam(defaultValue = "1") Integer pageNum,
            @Parameter(description = "每页数量") @RequestParam(defaultValue = "10") Integer pageSize) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        PageResult<PointsRecord> pageResult = pointsRecordService.getUserRecordList(userId, pageNum, pageSize);
        return Result.success(pageResult);
    }

    /**
     * 卡密充值
     */
    @Operation(summary = "卡密充值", description = "使用卡密兑换积分")
    @PostMapping("/cardkey/redeem")
    public Result<?> redeemCardKey(
            @Parameter(description = "卡密码") @RequestParam @NotBlank(message = "卡密码不能为空") String cardCode) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        User user = userMapper.selectById(userId);

        if (user == null) {
            return Result.error("用户不存在", 404);
        }

        if (user.getSiteId() == null) {
            return Result.error("用户站点信息不存在", 400);
        }

        try {
            Integer points = cardKeyService.redeemCardKey(user.getSiteId(), userId, cardCode.trim());

            // 获取更新后的用户信息
            User updatedUser = userMapper.selectById(userId);

            Map<String, Object> result = new HashMap<>();
            result.put("points", points);
            result.put("newBalance", updatedUser.getPoints());
            result.put("message", "充值成功，获得 " + points + " 积分");

            return Result.success(result, "充值成功");
        } catch (Exception e) {
            log.error("卡密充值失败: userId={}, cardCode={}, error={}", userId, cardCode, e.getMessage());
            return Result.error(e.getMessage(), 400);
        }
    }

    /**
     * 搜索同站点用户
     * 用于添加剧本成员时搜索用户
     */
    @Operation(summary = "搜索用户", description = "搜索同站点的用户（按用户名模糊匹配）")
    @GetMapping("/search")
    public Result<?> searchUsers(
            @Parameter(description = "搜索关键词") @RequestParam String keyword) {
        Long userId = StpKit.USER.getLoginIdAsLong();
        Long siteId = SecurityUtils.getAppLoginUserSiteId();

        if (keyword == null || keyword.trim().isEmpty()) {
            return Result.error("搜索关键词不能为空", 400);
        }

        try {
            LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(User::getSiteId, siteId)
                    .eq(User::getStatus, User.Status.ENABLED)
                    .ne(User::getId, userId) // 排除自己
                    .and(w -> w.like(User::getUsername, keyword.trim())
                            .or()
                            .like(User::getNickname, keyword.trim()))
                    .select(User::getId, User::getUsername, User::getNickname, User::getAvatar)
                    .last("LIMIT 20"); // 最多返回20条

            List<User> users = userMapper.selectList(queryWrapper);

            List<Map<String, Object>> result = users.stream().map(user -> {
                Map<String, Object> item = new HashMap<>();
                item.put("id", user.getId());
                item.put("username", user.getUsername());
                item.put("nickname", user.getNickname());
                item.put("avatar", user.getAvatar());
                return item;
            }).toList();

            log.info("搜索用户成功: userId={}, keyword={}, count={}", userId, keyword, result.size());
            return Result.success(result);

        } catch (Exception e) {
            log.error("搜索用户失败: userId={}, keyword={}, error={}", userId, keyword, e.getMessage());
            return Result.error("搜索用户失败: " + e.getMessage(), 500);
        }
    }
}
