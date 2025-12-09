-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: gestion_stock
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('0df06025-d5a1-466d-9f99-b81f570617d8','33f0dd4420f3030f01998cc034f4bd24740d0c5cd548cf65fe2fe97342edb655','2025-12-07 21:24:37.535','20251207161726_add_user_permissions',NULL,NULL,'2025-12-07 21:24:37.424',1),('333ef38d-5960-48bd-bb7d-787add8a7bb1','94fc3974ba93c5bbabfcd9a05a41fda7a2504c4e0abe7ad521554fd83631bc10','2025-12-07 21:24:37.699','20251207185058_add_supplier',NULL,NULL,'2025-12-07 21:24:37.537',1),('4498e32c-9274-4ab8-a524-268588203b98','450a6efe625e509476cd641850aed731bd5e1431162a257eb76ebc2d897d6fdd','2025-12-07 21:24:37.421','20251207130000_rename_email_to_identifiant',NULL,NULL,'2025-12-07 21:24:37.381',1),('5b627fa8-82c5-4f2b-8f1e-16c71ea8fac7','f45342b6b07c3324436f6044dfae0cd3f5da35c441e8649d6c7dbd3bc1b123d3','2025-12-07 21:24:37.077','20251123191421_init',NULL,NULL,'2025-12-07 21:24:36.377',1),('66b27c44-e7c8-4619-9b64-a780948364cf','001e8c3e690f29e9a3a3e56fb6d7d12bbfa88eb51648b183fec47a5c3a9670d0','2025-12-07 21:24:37.123','20251126015424_add_establishment_address',NULL,NULL,'2025-12-07 21:24:37.080',1),('71296838-a9f1-46e6-887c-47fe42a7af16','b1e59eeb49f6292b6fe77fcf1ef35fe0e245b3322340948ca8324f98f58894f6','2025-12-07 21:24:37.329','20251207113000_add_demande_agent_snapshot',NULL,NULL,'2025-12-07 21:24:37.281',1),('ab5a59f0-c4b1-464c-aa93-a1a01f7cb1d2','c82ec9c9186e7dad97abe8f678e7905f88e90572881b3e434af053782fcefc46','2025-12-07 21:24:37.279','20251207110000_agent_nullable_set_null',NULL,NULL,'2025-12-07 21:24:37.180',1),('ed9aee9a-dada-4710-9587-a33f432b371d','5c4e5f4915a56d8a8dbfcc39c611f25afc233e9e819d3f451fc7d8f5b6759b96','2025-12-07 21:24:37.378','20251207123000_add_contact_email_to_users',NULL,NULL,'2025-12-07 21:24:37.331',1),('f79150d6-81dd-482e-94c9-85706e896899','e704245fa5ab711a17d4d8f01184f0d2f88b6201c7a84c51de5291e92ff2a597','2025-12-07 21:24:37.178','20251206000000_add_demande_reference',NULL,NULL,'2025-12-07 21:24:37.125',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `articles`
--

DROP TABLE IF EXISTS `articles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `articles` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `categorie_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` int NOT NULL,
  `reference_fournisseur` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `seuil_alerte` int NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `conditionnement` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `articles_etablissement_id_idx` (`etablissement_id`),
  KEY `articles_categorie_id_idx` (`categorie_id`),
  CONSTRAINT `articles_categorie_id_fkey` FOREIGN KEY (`categorie_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `articles_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `articles`
--

LOCK TABLES `articles` WRITE;
/*!40000 ALTER TABLE `articles` DISABLE KEYS */;
INSERT INTO `articles` VALUES ('cmixjkg6p000po72g1x3naf35','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Optimax LV toute eaux 20L',0,'527675',0,NULL,NULL,'2025-12-08 19:25:42.755','2025-12-08 19:25:42.755'),('cmixjqlbh000qo72gt6pliouv','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Optimax plonge désinfectant 5L',0,'527684',0,NULL,NULL,'2025-12-08 19:30:29.353','2025-12-08 19:30:29.353'),('cmixjtrqq000so72gm1ltvl1y','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Optimax dégraissant désinfectant Moussant 5L',0,'527690',0,NULL,NULL,'2025-12-08 19:32:57.650','2025-12-08 19:32:57.650'),('cmixjvgyd000to72g7zu71i8t','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Optimax nettoyant dégraissant désinfectant 5L',0,'527693',0,NULL,NULL,'2025-12-08 19:34:16.982','2025-12-08 19:34:16.982'),('cmixjw7pj000uo72g909x316s','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Optimax détartrant 5L',0,'527688',0,NULL,NULL,'2025-12-08 19:34:51.655','2025-12-08 19:34:51.655'),('cmixjy866000vo72gkmavbrtt','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Optimax four et grille 750ML (x6)',0,'527699',0,NULL,NULL,'2025-12-08 19:36:25.567','2025-12-08 19:36:25.567'),('cmixjzhar000wo72gujiwsb89','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Desty détergent désinfectant acide 5L',0,'527832',0,NULL,NULL,'2025-12-08 19:37:24.052','2025-12-08 19:37:24.052'),('cmixk0xja000xo72g53wdyqmy','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Tabs d\'entretien pour frima (bleu) sceau 150',0,'526773',0,NULL,NULL,'2025-12-08 19:38:31.750','2025-12-08 19:38:31.750'),('cmixk2nlh000yo72gwa4lgnip','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Ballet alimentaire 38 cm polyester Mi-dur douille droite ( rouge )',0,'006774',0,NULL,NULL,'2025-12-08 19:39:52.181','2025-12-08 19:39:52.181'),('cmixk42kr000zo72giybxn66b','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Raclette sol alimentaire 55 cm Mousse blanche',0,'006619',0,NULL,NULL,'2025-12-08 19:40:58.252','2025-12-08 19:40:58.252'),('cmixlbw4f0010o72giglfwnez','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Brosse tank à lait polyester',0,'006238',0,NULL,NULL,'2025-12-08 20:15:02.751','2025-12-08 20:15:02.751'),('cmixlea8a0011o72gybn4rvcd','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Film alimentaire étirable 45 cm x 300 m ( x4 )',0,'533630',0,NULL,NULL,'2025-12-08 20:16:54.347','2025-12-08 20:16:54.347'),('cmixlfqpg0012o72gta5l4ew9','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Charlotte clip NT blanche sachet ( x100 )',0,'059170',0,NULL,NULL,'2025-12-08 20:18:02.356','2025-12-08 20:18:02.356'),('cmixlh7mq0013o72gzm8a48t4','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Sel adoucisseur Axal Pro 15  kg',0,'505195',0,NULL,NULL,'2025-12-08 20:19:10.946','2025-12-08 20:19:10.946'),('cmixlibre0014o72go7bqwmuv','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Vinaigre d\'alcool cristal 8° écocert 1 L',0,'512183',0,NULL,NULL,'2025-12-08 20:20:02.955','2025-12-08 20:20:02.955'),('cmixlqgia0017o72g8f74krpy','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Rouleau abrasif vert AO 3m x 0.14',0,'001728',0,NULL,NULL,'2025-12-08 20:26:22.352','2025-12-08 20:26:22.352'),('cmixlx15w0018o72gqovyjb1h','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Tampon abrasif noir épais R76 (x10)',0,'010763',0,NULL,NULL,'2025-12-08 20:31:29.060','2025-12-08 20:31:29.060'),('cmixlyqvz0019o72gy6vdodex','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Tampon abrasif vert AO GM 225mm x 140 ( x10 )',0,'001724',0,NULL,NULL,'2025-12-08 20:32:49.055','2025-12-08 20:32:49.055'),('cmixm1kfq001ao72gfpsypj94','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Éponge végétale Azela basic ( x10)',0,'122886',0,NULL,NULL,'2025-12-08 20:35:00.662','2025-12-08 20:35:00.662'),('cmixm3cbe001bo72gw5nzk8nk','cmiw9frxs0001lo2kffeiv3fj','cmiwxjip9000xju2f61z89xch','Rouleaux abrasif vert AO 5m x 0.14',0,'535938',0,NULL,NULL,'2025-12-08 20:36:23.451','2025-12-08 20:36:23.451'),('cmixmwe2o0002pd2zjjyjyxzy','cmiw9frxs0001lo2kffeiv3fj','cmixmtnub0001pd2zto577379','Serviette ouate blanche 30 x 30 ( x 3200 )',0,'129004',0,NULL,NULL,'2025-12-08 20:58:58.752','2025-12-08 20:58:58.752'),('cmixn193s0000oz2bftboq7na','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Taski  Jontec  Future 5L',0,'028018',0,NULL,NULL,'2025-12-08 21:02:45.592','2025-12-08 21:02:45.592'),('cmixn43tl0001oz2b26qt1jll','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Pollet polstrip / vinyle stripper décapant 5L',0,'004811',0,NULL,NULL,'2025-12-08 21:04:58.713','2025-12-08 21:04:58.713'),('cmixn652i0002oz2b50u0f4gc','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Bouche pores exe0005 BP 5L',0,'503837',0,NULL,NULL,'2025-12-08 21:06:33.642','2025-12-08 21:06:33.642'),('cmixn7f290003oz2bcf67b3cu','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Taski jontec  éternum 5L',0,'027948',0,NULL,NULL,'2025-12-08 21:07:33.249','2025-12-08 21:07:33.249'),('cmixn940g0004oz2bvjj4fqx2','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Taski jontec 300 pur-eco 5L',0,'058355',0,NULL,NULL,'2025-12-08 21:08:52.240','2025-12-08 21:08:52.240'),('cmixnadui0005oz2bskvzty95','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Taski jontec asset détergent neutre sol 5L',0,'533770',0,NULL,NULL,'2025-12-08 21:09:51.642','2025-12-08 21:09:51.642'),('cmixnc54a0006oz2b76ixct0y','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Quattro select Dégragerme 2,5L ( x2 )',0,'119189',0,NULL,NULL,'2025-12-08 21:11:13.642','2025-12-08 21:11:13.642'),('cmixndzh80007oz2b0rebsm90','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Quattro select good sens vert 2,5L ( x2 )',0,'119188',0,NULL,NULL,'2025-12-08 21:12:39.645','2025-12-08 21:12:39.645'),('cmixng4se0008oz2bd4vnkk0f','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Disque 3M Blanc D 432 ( x5 )',0,'010827',0,NULL,NULL,'2025-12-08 21:14:19.839','2025-12-08 21:14:19.839'),('cmixnh4z60009oz2b9e01jeer','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Disque 3M noir D 432 ( x5 )',0,'010807',0,NULL,NULL,'2025-12-08 21:15:06.548','2025-12-08 21:15:06.548'),('cmixnhslf000aoz2bvtig1ds3','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Disque 3M rouge D 432 ( x5 )',0,'010821',0,NULL,NULL,'2025-12-08 21:15:37.348','2025-12-08 21:15:37.348'),('cmixo10n70000pa31cowbks1j','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Disque rouge 20cm - spray M3M / JET3 ( x5 )',0,'127552',0,NULL,NULL,'2025-12-08 21:30:34.243','2025-12-08 21:30:34.243'),('cmixo3jds0001pa31w22fz4u4','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Disque taski twister 17\" 43 cm blanc (x2)',0,'523300',0,NULL,NULL,'2025-12-08 21:32:31.840','2025-12-08 21:32:31.840'),('cmixo4c8s0002pa3101nyg09l','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Disque taski twister 17\" 43 cm orange (x2)',0,'523435',0,NULL,NULL,'2025-12-08 21:33:09.245','2025-12-08 21:33:09.245'),('cmixo4zjj0003pa311hts26ah','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Disque taski twister 17\" 43 cm vert (x2)',0,'523374',0,NULL,NULL,'2025-12-08 21:33:39.440','2025-12-08 21:33:39.440'),('cmixo5ju50004pa31n98h96m2','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Disque taski twister 17\" 43 cm violet (x2)',0,'523441',0,NULL,NULL,'2025-12-08 21:34:05.742','2025-12-08 21:34:05.742'),('cmixo70gj0005pa31fzniqatl','cmiw9frxs0001lo2kffeiv3fj','cmixlmpmq0016o72gnfjjkhw0','Embout à vis ( pour manche D.24 mm',0,'006632',0,NULL,NULL,'2025-12-08 21:35:13.940','2025-12-08 21:35:13.940');
/*!40000 ALTER TABLE `articles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `categories_etablissement_id_idx` (`etablissement_id`),
  CONSTRAINT `categories_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('cmiwxjip9000xju2f61z89xch','cmiw9frxs0001lo2kffeiv3fj','HYGIÈNE EN CUISINE'),('cmixlmpmq0016o72gnfjjkhw0','cmiw9frxs0001lo2kffeiv3fj','HYGIÈNE DES SOLS'),('cmixmtnub0001pd2zto577379','cmiw9frxs0001lo2kffeiv3fj','ARTS DE TABLE ET ACCUEIL');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commande_items`
--

DROP TABLE IF EXISTS `commande_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commande_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `commande_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `article_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `commande_items_commande_id_idx` (`commande_id`),
  KEY `commande_items_article_id_idx` (`article_id`),
  CONSTRAINT `commande_items_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `commande_items_commande_id_fkey` FOREIGN KEY (`commande_id`) REFERENCES `commandes_fournisseurs` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commande_items`
--

LOCK TABLES `commande_items` WRITE;
/*!40000 ALTER TABLE `commande_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `commande_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commandes_fournisseurs`
--

DROP TABLE IF EXISTS `commandes_fournisseurs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commandes_fournisseurs` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fournisseur` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('en_cours','recue') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `supplier_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `commandes_fournisseurs_etablissement_id_idx` (`etablissement_id`),
  KEY `commandes_fournisseurs_supplier_id_idx` (`supplier_id`),
  CONSTRAINT `commandes_fournisseurs_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `commandes_fournisseurs_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commandes_fournisseurs`
--

LOCK TABLES `commandes_fournisseurs` WRITE;
/*!40000 ALTER TABLE `commandes_fournisseurs` DISABLE KEYS */;
INSERT INTO `commandes_fournisseurs` VALUES ('cmiwqj680000lju2fgflsj0od','cmiw9frxs0001lo2kffeiv3fj','cedeo','en_cours','2025-12-08 05:52:54.336','2025-12-08 05:52:54.336',NULL),('cmiwqjhjv000pju2f9ff9p4vf','cmiw9frxs0001lo2kffeiv3fj','cedeo','en_cours','2025-12-08 05:53:09.019','2025-12-08 05:53:09.019',NULL),('cmiwzl6vy0021ju2fyylygb6d','cmiw9frxs0001lo2kffeiv3fj','Daugeron','recue','2025-12-08 10:06:25.054','2025-12-08 10:07:23.748','cmiwszv09000tju2fv708n4it');
/*!40000 ALTER TABLE `commandes_fournisseurs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demande_items`
--

DROP TABLE IF EXISTS `demande_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demande_items` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `demande_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `article_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite_demandee` int NOT NULL,
  `quantite_preparee` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `demande_items_demande_id_idx` (`demande_id`),
  KEY `demande_items_article_id_idx` (`article_id`),
  CONSTRAINT `demande_items_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `demande_items_demande_id_fkey` FOREIGN KEY (`demande_id`) REFERENCES `demandes` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demande_items`
--

LOCK TABLES `demande_items` WRITE;
/*!40000 ALTER TABLE `demande_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `demande_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `demandes`
--

DROP TABLE IF EXISTS `demandes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `demandes` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `agent_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('en_attente','preparee','modifiee','refusee') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `reference` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agent_nom` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agent_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `demandes_reference_key` (`reference`),
  KEY `demandes_etablissement_id_idx` (`etablissement_id`),
  KEY `demandes_agent_id_idx` (`agent_id`),
  CONSTRAINT `demandes_agent_id_fkey` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `demandes_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `demandes`
--

LOCK TABLES `demandes` WRITE;
/*!40000 ALTER TABLE `demandes` DISABLE KEYS */;
INSERT INTO `demandes` VALUES ('cmiwd9x5h000aju2fe1lblant','cmiw9frxs0001lo2kffeiv3fj',NULL,'preparee','2025-12-07 23:41:47.669','2025-12-07 23:42:20.923','CMD-ICUQX2','agent','agent@agent.fr'),('cmiwqexgp000eju2fbs7s60qn','cmiw9frxs0001lo2kffeiv3fj',NULL,'preparee','2025-12-08 05:49:36.361','2025-12-08 05:50:23.617','CMD-MSLQEP','agent','agent@agent.fr'),('cmiwzhnmk001wju2f44j26pv9','cmiw9frxs0001lo2kffeiv3fj','cmiwzbkne001uju2f991w9koe','preparee','2025-12-08 10:03:40.123','2025-12-08 10:04:47.322','CMD-NDQ4VO','Mariama DOUMBOUYA','Mariama.doumbouya@iledefrance.fr'),('cmixiwyys000jo72gxcqodeuj','cmiw9frxs0001lo2kffeiv3fj','cmixidxuc000do72g2u1467i9','en_attente','2025-12-08 19:07:27.361','2025-12-08 19:07:27.361','CMD-BH1OAA','Daniella DEZE','Daniella.DEZE@iledefrance.fr');
/*!40000 ALTER TABLE `demandes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `etablissements`
--

DROP TABLE IF EXISTS `etablissements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `etablissements` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `adresse` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code_postal` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ville` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `etablissements`
--

LOCK TABLES `etablissements` WRITE;
/*!40000 ALTER TABLE `etablissements` DISABLE KEYS */;
INSERT INTO `etablissements` VALUES ('cmiw9frxs0001lo2kffeiv3fj','Lycée Antoine de Saint-Exupéry','2025-12-07 21:54:22.385','2025-12-07 21:57:44.331','2-4 rue Henri Matisse','94000','Créteil');
/*!40000 ALTER TABLE `etablissements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mouvements`
--

DROP TABLE IF EXISTS `mouvements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mouvements` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `article_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('entree','sortie') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantite` int NOT NULL,
  `commentaire` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `mouvements_etablissement_id_idx` (`etablissement_id`),
  KEY `mouvements_article_id_idx` (`article_id`),
  KEY `mouvements_user_id_idx` (`user_id`),
  CONSTRAINT `mouvements_article_id_fkey` FOREIGN KEY (`article_id`) REFERENCES `articles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `mouvements_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `mouvements_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mouvements`
--

LOCK TABLES `mouvements` WRITE;
/*!40000 ALTER TABLE `mouvements` DISABLE KEYS */;
/*!40000 ALTER TABLE `mouvements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `adresse` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `suppliers_etablissement_id_idx` (`etablissement_id`),
  CONSTRAINT `suppliers_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES ('cmiwszv09000tju2fv708n4it','cmiw9frxs0001lo2kffeiv3fj','Daugeron','12 route de montigny 77690 Montigny sur loing','2025-12-08 07:01:52.186','2025-12-08 07:01:52.186');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `etablissement_id` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nom` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identifiant` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('superadmin','admin','responsable','agent') COLLATE utf8mb4_unicode_ci NOT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `contact_email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permissions` json NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_identifiant_key` (`identifiant`),
  KEY `users_etablissement_id_fkey` (`etablissement_id`),
  CONSTRAINT `users_etablissement_id_fkey` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('cmiw8dk580001pl32o1uijsa3',NULL,'Super Admin','admin-s','$2a$10$wuaFzGoh1hxSirK.ixIVPudrW58GVeFKp4OiD08GCpgoFjFblwEqG','superadmin',1,'2025-12-07 21:24:39.357','2025-12-07 21:24:39.357','admin-s@example.com','{\"abilities\": {\"manageProducts\": true, \"manageMovements\": true, \"manageCategories\": true, \"manageSupplierOrders\": true}, \"allowedSections\": [\"establishments\", \"responsable\", \"products\", \"movements\", \"supplierOrders\", \"users\"]}'),('cmiwxeui5000vju2fhxzuhj4v','cmiw9frxs0001lo2kffeiv3fj','Ousmane ADOUM TIDEY','ATO','$2a$10$1ezE.DwEeqamxy1Z2KURYumlWFL3riae0BPa9NrS55PBU2FGodncK','responsable',1,'2025-12-08 09:05:29.836','2025-12-08 11:15:32.156','ousmane.adoum-tidey@iledefrance.fr','{\"abilities\": {\"manageProducts\": true, \"manageMovements\": true, \"manageCategories\": true, \"manageSupplierOrders\": true}, \"allowedSections\": [\"responsable\", \"supplierOrders\", \"products\", \"movements\"]}'),('cmiwzbkne001uju2f991w9koe','cmiw9frxs0001lo2kffeiv3fj','Mariama DOUMBOUYA','DOUMBOUYA','$2a$10$3YA.NNrhtLtvExC.noAOX.h0jTeavIr4Sx1peAjnkGtXQs7M1iNuO','agent',1,'2025-12-08 09:58:56.330','2025-12-08 09:58:56.330','Mariama.doumbouya@iledefrance.fr','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixi377z0001o72gs5wm80bc','cmiw9frxs0001lo2kffeiv3fj','Victorine TOFFO HOUSSOU','Victorine Toffo houssou','$2a$10$7ntrxcPQm0zr7emGp99/KuaZxB7JV94Z22tS6vi07pSY3C/qEabm2','agent',1,'2025-12-08 18:44:18.377','2025-12-08 18:44:40.680','victorine.toffo-houssou@iledefrance.fr','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixi61e00003o72gcdgr6lpm','cmiw9frxs0001lo2kffeiv3fj','Susanne MARINETTE','Susanne MARINETTE','$2a$10$L1BgClKb3iP7oriCuZLTdOElzrCYCivngv18.C1ymSlQaRVlV3UOq','agent',1,'2025-12-08 18:46:30.792','2025-12-08 18:46:30.792','susanne.marinette@iledefrance.fr','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixi7dj60005o72grmz5xtks','cmiw9frxs0001lo2kffeiv3fj','Cécile VION','Cécile VION','$2a$10$DfR.cLuXbV9iodOKH7i.he2EPq91Z1P9d0UKEWXAJSC.n9Z2A6iIK','agent',1,'2025-12-08 18:47:33.186','2025-12-08 18:47:33.186','cecile.vion@iledefrance.fr','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixi8qwq0007o72gjdqap0cv','cmiw9frxs0001lo2kffeiv3fj','Bertrand DOLON','Bertrand DOLON','$2a$10$U6Hi.IGHYO4Dm6dCJmzXgOX7v5JWoNHB80oNuoxwtuitVYO190tp2','agent',1,'2025-12-08 18:48:37.178','2025-12-08 18:48:37.178','BERTRAND.DOLON@iledefrance.fr','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixiaebd0009o72g2mop3cuc','cmiw9frxs0001lo2kffeiv3fj','Nzala MAFUENI','Nzala MAFUENI','$2a$10$xpLKvN5w444V1O83Cv7gkeENLCRS0WP.7E4tFjA.lvcOb83sonDci','agent',1,'2025-12-08 18:49:54.169','2025-12-08 18:49:54.169','NZALA.MAFUENI@iledefrance.fr','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixice8e000bo72gs20gd7lm','cmiw9frxs0001lo2kffeiv3fj','Marilyne VIGOUROUX','Marilyne VIGOUROUX','$2a$10$v0WnIa5XTco6sw/831Qt3.w4g.6oCxWKW2gzQ9xwMYsm6DHa0tEOS','agent',1,'2025-12-08 18:51:27.374','2025-12-08 18:51:27.374','Marilyne.VIGOUROUX@iledefrance','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixidxuc000do72g2u1467i9','cmiw9frxs0001lo2kffeiv3fj','Daniella DEZE','Daniella DEZE','$2a$10$ypi.8H5fH6zOJLyOghIXJO6etBTTZIW1xXeqADnRYQ46Q/qWAh9zO','agent',1,'2025-12-08 18:52:39.444','2025-12-08 18:52:39.444','Daniella.DEZE@iledefrance.fr','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixifupx000fo72g3zxme2mn','cmiw9frxs0001lo2kffeiv3fj','Nicky KANIKI BITANGILA','Nicky KANIKI BITANGILA','$2a$10$GXvLA5BFMyH7loZUeoK3WOPqM7LqF.aFqkGp2okVA9B5FMaeOCPBO','agent',1,'2025-12-08 18:54:08.709','2025-12-08 18:54:08.709','nicky.kaniki-bitangila@iledefrance.fr','{\"abilities\": {\"manageProducts\": false, \"manageMovements\": false, \"manageCategories\": false, \"manageSupplierOrders\": false}, \"allowedSections\": [\"agent\"]}'),('cmixihyk0000ho72gg5pnb3dl','cmiw9frxs0001lo2kffeiv3fj','Modibo DIARRA','Modibo DIARRA','$2a$10$avJtaHHiFEfeD8tbiiaF/uWJWaKKUn46JQSRtbwf1W7dN4Lkgl.q.','admin',1,'2025-12-08 18:55:46.992','2025-12-08 18:55:46.992','Modibo.DIARRA@iledefrance.fr','{\"abilities\": {\"manageProducts\": true, \"manageMovements\": true, \"manageCategories\": true, \"manageSupplierOrders\": true}, \"allowedSections\": [\"establishments\", \"responsable\", \"products\", \"movements\", \"supplierOrders\", \"users\"]}');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-08 22:15:01
