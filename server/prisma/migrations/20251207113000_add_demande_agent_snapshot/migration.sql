-- Ajouter les snapshots de l'agent sur les demandes
ALTER TABLE `demandes`
ADD COLUMN `agent_nom` VARCHAR(191) NULL,
ADD COLUMN `agent_email` VARCHAR(191) NULL;

-- Peupler avec les valeurs actuelles
UPDATE `demandes` d
LEFT JOIN `users` u ON u.id = d.agent_id
SET d.agent_nom = u.nom, d.agent_email = u.email;
