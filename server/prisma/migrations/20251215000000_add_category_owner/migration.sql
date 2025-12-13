-- AlterTable
ALTER TABLE `categories` ADD COLUMN `owner_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `categories_owner_id_idx` ON `categories`(`owner_id`);

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
