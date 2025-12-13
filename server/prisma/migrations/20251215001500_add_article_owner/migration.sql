-- AlterTable
ALTER TABLE `articles` ADD COLUMN `owner_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `articles_owner_id_idx` ON `articles`(`owner_id`);

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
