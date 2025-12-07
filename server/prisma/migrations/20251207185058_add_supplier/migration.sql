-- AlterTable
ALTER TABLE `commandes_fournisseurs` ADD COLUMN `supplier_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `suppliers` (
    `id` VARCHAR(191) NOT NULL,
    `etablissement_id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `adresse` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `suppliers_etablissement_id_idx`(`etablissement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `commandes_fournisseurs_supplier_id_idx` ON `commandes_fournisseurs`(`supplier_id`);

-- AddForeignKey
ALTER TABLE `commandes_fournisseurs` ADD CONSTRAINT `commandes_fournisseurs_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
