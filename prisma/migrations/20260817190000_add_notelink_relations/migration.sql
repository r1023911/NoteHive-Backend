-- AddForeignKey
ALTER TABLE `notelink` ADD CONSTRAINT `notelink_fromNoteId_fkey` FOREIGN KEY (`fromNoteId`) REFERENCES `note`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notelink` ADD CONSTRAINT `notelink_toNoteId_fkey` FOREIGN KEY (`toNoteId`) REFERENCES `note`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
