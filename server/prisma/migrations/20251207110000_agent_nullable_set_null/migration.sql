-- Rendre agent_id nullable et mettre a null en cas de suppression d'utilisateur
ALTER TABLE `demandes` DROP FOREIGN KEY `demandes_agent_id_fkey`;
ALTER TABLE `demandes` MODIFY `agent_id` VARCHAR(191) NULL;
ALTER TABLE `demandes` ADD CONSTRAINT `demandes_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
