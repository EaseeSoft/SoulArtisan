package com.jf.soulartisan.admin.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jf.soulartisan.admin.dto.request.CardKeyGenerateRequest;
import com.jf.soulartisan.admin.dto.request.CardKeyQueryRequest;
import com.jf.soulartisan.admin.entity.CardKey;
import com.jf.soulartisan.admin.entity.PointsRecord;
import com.jf.soulartisan.admin.mapper.CardKeyMapper;
import com.jf.soulartisan.common.dto.PageResult;
import com.jf.soulartisan.common.exception.ServiceException;
import com.jf.soulartisan.entity.User;
import com.jf.soulartisan.mapper.UserMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 卡密管理服务
 */
@Slf4j
@Service
public class CardKeyService {

    @Autowired
    private CardKeyMapper cardKeyMapper;

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private PointsRecordService pointsRecordService;

    /**
     * 批量生成卡密
     *
     * @param siteId  站点ID
     * @param request 生成请求
     * @return 生成的卡密列表
     */
    @Transactional(rollbackFor = Exception.class)
    public List<CardKey> generateCardKeys(Long siteId, CardKeyGenerateRequest request) {
        // 参数校验
        if (request.getCount() == null || request.getCount() <= 0) {
            throw new ServiceException("生成数量必须大于0");
        }
        if (request.getCount() > 1000) {
            throw new ServiceException("单次生成数量不能超过1000");
        }
        if (request.getPoints() == null || request.getPoints() <= 0) {
            throw new ServiceException("积分值必须大于0");
        }

        // 生成批次号
        String batchNo = request.getBatchNo();
        if (!StringUtils.hasText(batchNo)) {
            batchNo = "BATCH" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        }

        List<CardKey> cardKeys = new ArrayList<>();
        for (int i = 0; i < request.getCount(); i++) {
            CardKey cardKey = new CardKey();
            cardKey.setSiteId(siteId);
            cardKey.setCardCode(generateUniqueCode());
            cardKey.setPoints(request.getPoints());
            cardKey.setStatus(CardKey.Status.UNUSED);
            cardKey.setBatchNo(batchNo);
            cardKey.setRemark(request.getRemark());
            cardKey.setExpiredAt(request.getExpiredAt());

            cardKeyMapper.insert(cardKey);
            cardKeys.add(cardKey);
        }

        log.info("批量生成卡密成功: siteId={}, count={}, batchNo={}, points={}",
                siteId, request.getCount(), batchNo, request.getPoints());

        return cardKeys;
    }

    /**
     * 获取卡密列表（分页）
     *
     * @param siteId   站点ID
     * @param pageNum  页码
     * @param pageSize 每页数量
     * @param request  查询条件
     * @return 卡密列表
     */
    public PageResult<CardKey> getCardKeyList(Long siteId, Integer pageNum, Integer pageSize, CardKeyQueryRequest request) {
        Page<CardKey> page = new Page<>(pageNum, pageSize);

        LambdaQueryWrapper<CardKey> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(CardKey::getSiteId, siteId);

        if (request != null) {
            if (StringUtils.hasText(request.getCardCode())) {
                queryWrapper.like(CardKey::getCardCode, request.getCardCode());
            }
            if (StringUtils.hasText(request.getBatchNo())) {
                queryWrapper.eq(CardKey::getBatchNo, request.getBatchNo());
            }
            if (request.getStatus() != null) {
                queryWrapper.eq(CardKey::getStatus, request.getStatus());
            }
        }

        queryWrapper.orderByDesc(CardKey::getCreatedAt);

        Page<CardKey> cardKeyPage = cardKeyMapper.selectPage(page, queryWrapper);

        PageResult<CardKey> pageResult = new PageResult<>();
        pageResult.setList(cardKeyPage.getRecords());
        pageResult.setTotal(cardKeyPage.getTotal());
        pageResult.setPage(pageNum);
        pageResult.setPageSize(pageSize);

        return pageResult;
    }

    /**
     * 获取卡密详情
     *
     * @param siteId 站点ID
     * @param id     卡密ID
     * @return 卡密详情
     */
    public CardKey getCardKeyDetail(Long siteId, Long id) {
        CardKey cardKey = cardKeyMapper.selectById(id);
        if (cardKey == null || !cardKey.getSiteId().equals(siteId)) {
            throw new ServiceException("卡密不存在");
        }
        return cardKey;
    }

    /**
     * 禁用卡密
     *
     * @param siteId 站点ID
     * @param id     卡密ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void disableCardKey(Long siteId, Long id) {
        CardKey cardKey = cardKeyMapper.selectById(id);
        if (cardKey == null || !cardKey.getSiteId().equals(siteId)) {
            throw new ServiceException("卡密不存在");
        }
        if (cardKey.getStatus() == CardKey.Status.USED) {
            throw new ServiceException("已使用的卡密无法禁用");
        }

        cardKey.setStatus(CardKey.Status.DISABLED);
        cardKeyMapper.updateById(cardKey);

        log.info("禁用卡密成功: id={}, cardCode={}", id, cardKey.getCardCode());
    }

    /**
     * 启用卡密
     *
     * @param siteId 站点ID
     * @param id     卡密ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void enableCardKey(Long siteId, Long id) {
        CardKey cardKey = cardKeyMapper.selectById(id);
        if (cardKey == null || !cardKey.getSiteId().equals(siteId)) {
            throw new ServiceException("卡密不存在");
        }
        if (cardKey.getStatus() == CardKey.Status.USED) {
            throw new ServiceException("已使用的卡密无法启用");
        }

        cardKey.setStatus(CardKey.Status.UNUSED);
        cardKeyMapper.updateById(cardKey);

        log.info("启用卡密成功: id={}, cardCode={}", id, cardKey.getCardCode());
    }

    /**
     * 删除卡密
     *
     * @param siteId 站点ID
     * @param id     卡密ID
     */
    @Transactional(rollbackFor = Exception.class)
    public void deleteCardKey(Long siteId, Long id) {
        CardKey cardKey = cardKeyMapper.selectById(id);
        if (cardKey == null || !cardKey.getSiteId().equals(siteId)) {
            throw new ServiceException("卡密不存在");
        }
        if (cardKey.getStatus() == CardKey.Status.USED) {
            throw new ServiceException("已使用的卡密无法删除");
        }

        cardKeyMapper.deleteById(id);

        log.info("删除卡密成功: id={}, cardCode={}", id, cardKey.getCardCode());
    }

    /**
     * 批量删除卡密
     *
     * @param siteId 站点ID
     * @param ids    卡密ID列表
     */
    @Transactional(rollbackFor = Exception.class)
    public void batchDeleteCardKeys(Long siteId, List<Long> ids) {
        for (Long id : ids) {
            CardKey cardKey = cardKeyMapper.selectById(id);
            if (cardKey == null || !cardKey.getSiteId().equals(siteId)) {
                continue;
            }
            if (cardKey.getStatus() == CardKey.Status.USED) {
                continue;
            }
            cardKeyMapper.deleteById(id);
        }

        log.info("批量删除卡密成功: siteId={}, ids={}", siteId, ids);
    }

    /**
     * 使用卡密（给用户增加积分）
     *
     * @param siteId   站点ID
     * @param userId   用户ID
     * @param cardCode 卡密码
     * @return 增加的积分值
     */
    @Transactional(rollbackFor = Exception.class)
    public Integer redeemCardKey(Long siteId, Long userId, String cardCode) {
        // 查找卡密
        LambdaQueryWrapper<CardKey> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(CardKey::getSiteId, siteId)
                .eq(CardKey::getCardCode, cardCode);
        CardKey cardKey = cardKeyMapper.selectOne(queryWrapper);

        if (cardKey == null) {
            throw new ServiceException("卡密不存在");
        }
        if (cardKey.getStatus() == CardKey.Status.USED) {
            throw new ServiceException("卡密已被使用");
        }
        if (cardKey.getStatus() == CardKey.Status.DISABLED) {
            throw new ServiceException("卡密已被禁用");
        }
        if (cardKey.getExpiredAt() != null && cardKey.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new ServiceException("卡密已过期");
        }

        // 查找用户
        User user = userMapper.selectById(userId);
        if (user == null || !user.getSiteId().equals(siteId)) {
            throw new ServiceException("用户不存在");
        }

        // 更新用户积分
        Integer currentPoints = user.getPoints() != null ? user.getPoints() : 0;
        Integer newPoints = currentPoints + cardKey.getPoints();
        user.setPoints(newPoints);
        userMapper.updateById(user);

        // 更新卡密状态
        cardKey.setStatus(CardKey.Status.USED);
        cardKey.setUsedBy(userId);
        cardKey.setUsedAt(LocalDateTime.now());
        cardKeyMapper.updateById(cardKey);

        // 记录积分变动
        pointsRecordService.recordPoints(siteId, userId, PointsRecord.Type.INCOME,
                cardKey.getPoints(), newPoints, PointsRecord.Source.CARD_KEY,
                cardKey.getId(), "卡密兑换: " + cardCode, null, null);

        log.info("卡密兑换成功: cardCode={}, userId={}, points={}", cardCode, userId, cardKey.getPoints());

        return cardKey.getPoints();
    }

    /**
     * 获取批次号列表
     *
     * @param siteId 站点ID
     * @return 批次号列表
     */
    public List<String> getBatchNoList(Long siteId) {
        LambdaQueryWrapper<CardKey> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(CardKey::getSiteId, siteId)
                .select(CardKey::getBatchNo)
                .groupBy(CardKey::getBatchNo)
                .orderByDesc(CardKey::getCreatedAt);

        List<CardKey> cardKeys = cardKeyMapper.selectList(queryWrapper);
        List<String> batchNoList = new ArrayList<>();
        for (CardKey cardKey : cardKeys) {
            if (StringUtils.hasText(cardKey.getBatchNo())) {
                batchNoList.add(cardKey.getBatchNo());
            }
        }
        return batchNoList;
    }

    /**
     * 生成唯一的卡密码
     *
     * @return 卡密码
     */
    private String generateUniqueCode() {
        // 生成16位大写字母+数字的卡密码
        String uuid = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        return uuid.substring(0, 16);
    }
}
