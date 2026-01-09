package com.jf.soulartisan.service;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.common.dto.UserUpdateRequest;
import com.jf.soulartisan.common.security.SecurityUtils;
import com.jf.soulartisan.common.security.StpKit;
import com.jf.soulartisan.common.util.PasswordUtil;
import com.jf.soulartisan.common.util.RoleUtil;
import com.jf.soulartisan.entity.User;
import com.jf.soulartisan.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class UserService {

    @Autowired
    private UserMapper userMapper;

    /**
     * 用户登录
     *
     * @param username 用户名
     * @param password 密码
     * @param siteId   站点ID
     * @return 登录结果
     */
    public Map<String, Object> login(String username, String password, Long siteId) {
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            return null;
        }

        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, username);
        // 如果提供了站点ID，则限制只在该站点内查找
        if (siteId != null) {
            queryWrapper.eq(User::getSiteId, siteId);
        }
        User user = userMapper.selectOne(queryWrapper);

        if (user == null) {
            log.warn("登录失败: 用户不存在, username={}, siteId={}", username, siteId);
            return null;
        }

        if (!PasswordUtil.verify(password, user.getPassword())) {
            log.warn("登录失败: 密码错误, username={}", username);
            return null;
        }

        String token = SecurityUtils.userLogin(user.getId());

        // 将 siteId 存储到 session 中，便于后续获取
        if (user.getSiteId() != null) {
            StpKit.USER.getSession().set("siteId", user.getSiteId());
        }

        log.info("用户登录成功: userId={}, username={}, siteId={}", user.getId(), username, user.getSiteId());

        Map<String, Object> result = new HashMap<>();
        result.put("user", buildUserInfo(user));
        result.put("token", token);
        result.put("token_type", "Bearer");

        return result;
    }

    /**
     * 用户注册
     *
     * @param username 用户名
     * @param password 密码
     * @param email 邮箱
     * @param nickname 昵称
     * @param phone 手机号
     * @param siteId 站点ID
     * @return 注册结果
     */
    public Map<String, Object> register(String username, String password, String email,
                                        String nickname, String phone, Long siteId) {
        if (StrUtil.isBlank(username) || StrUtil.isBlank(password)) {
            return null;
        }

        // 检查用户名在当前站点下是否已存在
        LambdaQueryWrapper<User> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(User::getUsername, username);
        if (siteId != null) {
            queryWrapper.eq(User::getSiteId, siteId);
        }
        User existingUser = userMapper.selectOne(queryWrapper);

        if (existingUser != null) {
            log.warn("注册失败: 用户名已存在, username={}, siteId={}", username, siteId);
            return null;
        }

        User user = new User();
        user.setUsername(username);
        user.setPassword(PasswordUtil.hash(password));
        user.setEmail(StrUtil.isNotBlank(email) ? email : null);
        user.setNickname(StrUtil.isNotBlank(nickname) ? nickname : null);
        user.setPhone(StrUtil.isNotBlank(phone) ? phone : null);
        user.setPoints(0);
        user.setRole(RoleUtil.ROLE_USER);
        user.setSiteId(siteId); // 设置站点ID

        int result = userMapper.insert(user);

        if (result > 0) {
            String token = SecurityUtils.userLogin(user.getId());

            // 将 siteId 存储到 session 中
            if (user.getSiteId() != null) {
                StpKit.USER.getSession().set("siteId", user.getSiteId());
            }

            log.info("用户注册成功: userId={}, username={}, siteId={}", user.getId(), username, user.getSiteId());

            Map<String, Object> data = new HashMap<>();
            data.put("user", buildUserInfo(user));
            data.put("token", token);
            data.put("token_type", "Bearer");

            return data;
        }

        return null;
    }

    /**
     * 更新用户信息
     *
     * @param userId  用户ID
     * @param request 更新请求
     * @return 更新后的用户信息
     */
    public User updateUserInfo(Long userId, UserUpdateRequest request) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 更新非空字段
        boolean updated = false;
        if (StrUtil.isNotBlank(request.getNickname())) {
            user.setNickname(request.getNickname());
            updated = true;
        }
        if (StrUtil.isNotBlank(request.getEmail())) {
            user.setEmail(request.getEmail());
            updated = true;
        }
        if (StrUtil.isNotBlank(request.getPhone())) {
            user.setPhone(request.getPhone());
            updated = true;
        }

        if (updated) {
            userMapper.updateById(user);
            log.info("用户信息更新成功: userId={}", userId);
        }

        return user;
    }

    /**
     * 修改密码
     *
     * @param userId      用户ID
     * @param oldPassword 原密码
     * @param newPassword 新密码
     * @return 是否修改成功
     */
    public boolean updatePassword(Long userId, String oldPassword, String newPassword) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        // 验证原密码
        if (!PasswordUtil.verify(oldPassword, user.getPassword())) {
            log.warn("修改密码失败: 原密码错误, userId={}", userId);
            return false;
        }

        // 更新密码
        user.setPassword(PasswordUtil.hash(newPassword));
        userMapper.updateById(user);

        log.info("用户密码修改成功: userId={}", userId);
        return true;
    }

    /**
     * 更新用户头像
     *
     * @param userId    用户ID
     * @param avatarUrl 头像URL
     * @return 是否更新成功
     */
    public boolean updateAvatar(Long userId, String avatarUrl) {
        User user = userMapper.selectById(userId);
        if (user == null) {
            throw new RuntimeException("用户不存在");
        }

        user.setAvatar(avatarUrl);
        userMapper.updateById(user);

        log.info("用户头像更新成功: userId={}, avatarUrl={}", userId, avatarUrl);
        return true;
    }

    private Map<String, Object> buildUserInfo(User user) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("user_id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("nickname", user.getNickname());
        userInfo.put("email", user.getEmail());
        userInfo.put("phone", user.getPhone());
        userInfo.put("avatar", user.getAvatar());
        userInfo.put("points", user.getPoints());
        userInfo.put("role", user.getRole());
        userInfo.put("role_name", RoleUtil.getRoleDescription(user.getRole()));
        return userInfo;
    }
}
