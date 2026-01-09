package com.jf.soulartisan.service;

import com.jf.soulartisan.entity.Attachment;
import com.jf.soulartisan.mapper.AttachmentMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttachmentService {

    private final AttachmentMapper attachmentMapper;

    /**
     * 保存附件记录
     *
     * @param file         上传的文件
     * @param fileUrl      文件URL
     * @param uploadUserId 上传用户ID
     * @return 附件记录
     */
    public Attachment saveAttachment(MultipartFile file, String fileUrl, Long uploadUserId) {
        Attachment attachment = new Attachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileUrl(fileUrl);
        attachment.setFileSize(file.getSize());
        attachment.setMimeType(file.getContentType());
        attachment.setUploadUserId(uploadUserId);

        // 根据MIME类型判断文件类型
        String fileType = determineFileType(file.getContentType());
        attachment.setFileType(fileType);

        attachmentMapper.insert(attachment);
        log.info("保存附件记录成功: id={}, fileName={}, fileType={}",
                attachment.getId(), attachment.getFileName(), attachment.getFileType());

        return attachment;
    }

    /**
     * 根据MIME类型判断文件类型
     */
    private String determineFileType(String mimeType) {
        if (mimeType == null) {
            return Attachment.FileType.FILE;
        }

        if (mimeType.startsWith("image/")) {
            return Attachment.FileType.IMAGE;
        } else if (mimeType.startsWith("video/")) {
            return Attachment.FileType.VIDEO;
        } else {
            return Attachment.FileType.FILE;
        }
    }

    /**
     * 根据ID获取附件
     */
    public Attachment getById(Long id) {
        return attachmentMapper.selectById(id);
    }

    /**
     * 删除附件记录
     */
    public void deleteById(Long id) {
        attachmentMapper.deleteById(id);
        log.info("删除附件记录: id={}", id);
    }
}
