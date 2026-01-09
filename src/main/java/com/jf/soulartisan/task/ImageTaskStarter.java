package com.jf.soulartisan.task;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.jf.soulartisan.entity.ImageGenerationTask;
import com.jf.soulartisan.mapper.ImageGenerationTaskMapper;
import com.jf.soulartisan.service.ImageTaskPollingService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class ImageTaskStarter implements ApplicationRunner {

    @Autowired
    private ImageTaskPollingService imageTaskPollingService;

    @Autowired
    private ImageGenerationTaskMapper imageGenerationTaskMapper;

    @Override
    public void run(ApplicationArguments args) {
        log.info("检查是否有待处理的图片生成任务...");

        // 查询是否有待处理或处理中的任务
        LambdaQueryWrapper<ImageGenerationTask> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.in(ImageGenerationTask::getStatus,
                ImageGenerationTask.Status.PENDING,
                ImageGenerationTask.Status.PROCESSING);
        queryWrapper.last("LIMIT 1");

        Long count = imageGenerationTaskMapper.selectCount(queryWrapper);

        if (count != null && count > 0) {
            log.info("发现 {} 个待处理任务，启动轮询服务", count);
            imageTaskPollingService.startPolling();
        } else {
            log.info("没有待处理任务，轮询服务将在有新任务时自动启动");
        }
    }
}
