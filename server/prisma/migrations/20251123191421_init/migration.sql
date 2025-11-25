-- CreateTable
CREATE TABLE `etablissements` (
    `id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `etablissement_id` VARCHAR(191) NULL,
    `nom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mot_de_passe` VARCHAR(191) NOT NULL,
    `role` ENUM('superadmin', 'admin', 'responsable', 'agent') NOT NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` VARCHAR(191) NOT NULL,
    `etablissement_id` VARCHAR(191) NOT NULL,
    `nom` VARCHAR(191) NOT NULL,

    INDEX `categories_etablissement_id_idx`(`etablissement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `articles` (
    `id` VARCHAR(191) NOT NULL,
    `etablissement_id` VARCHAR(191) NOT NULL,
    `categorie_id` VARCHAR(191) NULL,
    `nom` VARCHAR(191) NOT NULL,
    `quantite` INTEGER NOT NULL,
    `reference_fournisseur` VARCHAR(191) NOT NULL,
    `seuil_alerte` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `conditionnement` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `articles_etablissement_id_idx`(`etablissement_id`),
    INDEX `articles_categorie_id_idx`(`categorie_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mouvements` (
    `id` VARCHAR(191) NOT NULL,
    `etablissement_id` VARCHAR(191) NOT NULL,
    `article_id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `type` ENUM('entree', 'sortie') NOT NULL,
    `quantite` INTEGER NOT NULL,
    `commentaire` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mouvements_etablissement_id_idx`(`etablissement_id`),
    INDEX `mouvements_article_id_idx`(`article_id`),
    INDEX `mouvements_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demandes` (
    `id` VARCHAR(191) NOT NULL,
    `etablissement_id` VARCHAR(191) NOT NULL,
    `agent_id` VARCHAR(191) NOT NULL,
    `statut` ENUM('en_attente', 'preparee', 'modifiee', 'refusee') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `demandes_etablissement_id_idx`(`etablissement_id`),
    INDEX `demandes_agent_id_idx`(`agent_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `demande_items` (
    `id` VARCHAR(191) NOT NULL,
    `demande_id` VARCHAR(191) NOT NULL,
    `article_id` VARCHAR(191) NOT NULL,
    `quantite_demandee` INTEGER NOT NULL,
    `quantite_preparee` INTEGER NOT NULL,

    INDEX `demande_items_demande_id_idx`(`demande_id`),
    INDEX `demande_items_article_id_idx`(`article_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commandes_fournisseurs` (
    `id` VARCHAR(191) NOT NULL,
    `etablissement_id` VARCHAR(191) NOT NULL,
    `fournisseur` VARCHAR(191) NOT NULL,
    `statut` ENUM('en_cours', 'recue') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `commandes_fournisseurs_etablissement_id_idx`(`etablissement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `commande_items` (
    `id` VARCHAR(191) NOT NULL,
    `commande_id` VARCHAR(191) NOT NULL,
    `article_id` VARCHAR(191) NOT NULL,
    `quantite` INTEGER NOT NULL,

    INDEX `commande_items_commande_id_idx`(`commande_id`),
    INDEX `commande_items_article_id_idx`(`article_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `categories` ADD CONSTRAINT `categories_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `articles` ADD CONSTRAINT `articles_categorie_id_fkey` FOREIGN KEY (`categorie_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvements` ADD CONSTRAINT `mouvements_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvements` ADD CONSTRAINT `mouvements_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mouvements` ADD CONSTRAINT `mouvements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demande_items` ADD CONSTRAINT `demande_items_demande_id_fkey` FOREIGN KEY (`demande_id`) REFERENCES `demandes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `demande_items` ADD CONSTRAINT `demande_items_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commandes_fournisseurs` ADD CONSTRAINT `commandes_fournisseurs_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commande_items` ADD CONSTRAINT `commande_items_commande_id_fkey` FOREIGN KEY (`commande_id`) REFERENCES `commandes_fournisseurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `commande_items` ADD CONSTRAINT `commande_items_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
