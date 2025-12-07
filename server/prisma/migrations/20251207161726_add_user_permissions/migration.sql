-- AlterTable
ALTER TABLE `articles` MODIFY `reference_fournisseur` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `permissions` JSON NOT NULL;
