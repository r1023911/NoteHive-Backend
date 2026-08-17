-- CreateTable
CREATE TABLE `share` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `noteId` INTEGER NOT NULL,
    `fromUserId` INTEGER NOT NULL,
    `toUserId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `share_toUserId_idx`(`toUserId`),
    INDEX `share_fromUserId_idx`(`fromUserId`),
    UNIQUE INDEX `share_noteId_toUserId_key`(`noteId`, `toUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `share` ADD CONSTRAINT `share_noteId_fkey` FOREIGN KEY (`noteId`) REFERENCES `note`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `share` ADD CONSTRAINT `share_fromUserId_fkey` FOREIGN KEY (`fromUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `share` ADD CONSTRAINT `share_toUserId_fkey` FOREIGN KEY (`toUserId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
