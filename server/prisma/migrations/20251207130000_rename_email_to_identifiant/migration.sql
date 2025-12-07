ALTER TABLE `users` CHANGE `email` `identifiant` VARCHAR(191) NOT NULL;

-- conserver l'unicite
ALTER TABLE `users` DROP INDEX `users_email_key`, ADD UNIQUE INDEX `users_identifiant_key` (`identifiant`);
