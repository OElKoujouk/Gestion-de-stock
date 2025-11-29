-- AlterTable
ALTER TABLE `etablissements` ADD COLUMN `adresse` VARCHAR(191) NULL,
    ADD COLUMN `code_postal` VARCHAR(191) NULL,
    ADD COLUMN `ville` VARCHAR(191) NULL;
