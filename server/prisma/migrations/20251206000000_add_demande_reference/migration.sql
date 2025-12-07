-- Add reference column for demandes
ALTER TABLE `demandes`
ADD COLUMN `reference` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `demandes_reference_key` ON `demandes`(`reference`);
