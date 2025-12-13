-- AlterTable
ALTER TABLE `demandes` ADD COLUMN `valide_par_id` VARCHAR(191) NULL,
    ADD COLUMN `valide_par_nom` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `demandes_valide_par_id_idx` ON `demandes`(`valide_par_id`);

-- AddForeignKey
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_valide_par_id_fkey` FOREIGN KEY (`valide_par_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
