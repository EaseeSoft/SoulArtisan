-- Add avatar column to users table
ALTER TABLE `users`
    ADD COLUMN `avatar` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL COMMENT '头像URL' AFTER `phone`;
