-- MySQL dump 10.13  Distrib 9.4.0, for macos15.4 (arm64)
--
-- Host: localhost    Database: TVL_001
-- ------------------------------------------------------
-- Server version	9.4.0

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
-- Table structure for table `acXaccount`
--

DROP TABLE IF EXISTS `acXaccount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acXaccount` (
  `ac_acid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Account ID',
  `ac_bkid` bigint NOT NULL COMMENT 'Booking ID',
  `ac_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer User ID',
  `ac_totamt` decimal(15,2) DEFAULT '0.00' COMMENT 'Total Amount',
  `ac_rcvdamt` decimal(15,2) DEFAULT '0.00' COMMENT 'Received Amount',
  `ac_pendamt` decimal(15,2) DEFAULT '0.00' COMMENT 'Pending Amount',
  `ac_duedt` datetime DEFAULT NULL COMMENT 'Due Date',
  `ac_fyear` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Financial Year',
  `ac_status` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT 'Account Status',
  `edtm` datetime NOT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entered By',
  `mdtm` datetime NOT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`ac_acid`),
  KEY `ac_bkid` (`ac_bkid`),
  KEY `ac_usid` (`ac_usid`),
  CONSTRAINT `acxaccount_ibfk_1` FOREIGN KEY (`ac_bkid`) REFERENCES `bkXbooking` (`bk_bkid`) ON UPDATE CASCADE,
  CONSTRAINT `acxaccount_ibfk_2` FOREIGN KEY (`ac_usid`) REFERENCES `usXuser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acXaccount`
--

LOCK TABLES `acXaccount` WRITE;
/*!40000 ALTER TABLE `acXaccount` DISABLE KEYS */;
INSERT INTO `acXaccount` VALUES (1,1,'CUS001',5000.00,5000.00,0.00,'2025-11-25 00:00:00','2025-26','PAID','2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001'),(2,2,'CUS001',1000.00,1000.00,0.00,'2025-12-10 00:00:00','2025-26','PAID','2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001'),(3,3,'CUS001',2400.00,0.00,2400.00,'2025-11-15 00:00:00','2025-26','REFUNDED','2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001');
/*!40000 ALTER TABLE `acXaccount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bkXbooking`
--

DROP TABLE IF EXISTS `bkXbooking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bkXbooking` (
  `bk_bkid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Booking ID',
  `bk_bkno` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Booking Number',
  `bk_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer User ID',
  `bk_phonenumber` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Customer Phone Number (10-15 digits)',
  `bk_customername` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Customer Name (for quick access)',
  `bk_fromst` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'From Station',
  `bk_tost` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'To Station',
  `bk_trvldt` datetime NOT NULL COMMENT 'Travel Date',
  `bk_class` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Travel Class',
  `bk_quota` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'TATKAL' COMMENT 'Quota',
  `bk_berthpref` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Berth Preference',
  `bk_totalpass` int DEFAULT '1' COMMENT 'Total Passengers',
  `bk_reqdt` datetime DEFAULT NULL COMMENT 'Request Date',
  `bk_status` enum('DRF','CNF','CAN','PND','PAD','FNL','INA') COLLATE utf8mb4_unicode_ci DEFAULT 'DRF' COMMENT 'Booking Status (DRF: Draft, CNF: Confirmed, CAN: Cancelled, PND: Pending, etc.)',
  `bk_agent` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Assigned Agent',
  `bk_priority` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'NORMAL' COMMENT 'Booking Priority',
  `bk_remarks` text COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `bk_pnr` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PNR Number',
  `bk_billed` tinyint DEFAULT '0' COMMENT 'Billing Status',
  `edtm` datetime NOT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entered By',
  `mdtm` datetime NOT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `entered_by` int DEFAULT NULL COMMENT 'Entered By User ID',
  `entered_on` datetime DEFAULT NULL COMMENT 'Entered On',
  `modified_by` int DEFAULT NULL COMMENT 'Modified By User ID',
  `modified_on` datetime DEFAULT NULL COMMENT 'Modified On',
  `closed_by` int DEFAULT NULL COMMENT 'Closed By User ID',
  `closed_on` datetime DEFAULT NULL COMMENT 'Closed On',
  `status` enum('OPEN','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'OPEN' COMMENT 'Record Status',
  PRIMARY KEY (`bk_bkid`),
  UNIQUE KEY `bk_bkno` (`bk_bkno`),
  UNIQUE KEY `bk_xbooking_bk_bkno` (`bk_bkno`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bkXbooking`
--

LOCK TABLES `bkXbooking` WRITE;
/*!40000 ALTER TABLE `bkXbooking` DISABLE KEYS */;
INSERT INTO `bkXbooking` VALUES (1,'BK2025001','CUS001',NULL,NULL,'CSMT','NDLS','2025-12-01 00:00:00','3A','TATKAL','LB',2,'2025-11-20 00:00:00','CNF','EMP001','HIGH','Business travel - confirmed booking',NULL,0,'2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001',NULL,'2026-06-16 08:28:37',NULL,NULL,NULL,NULL,'OPEN'),(2,'BK2025002','CUS001',NULL,NULL,'NDLS','BLR','2025-12-15 00:00:00','2A','TATKAL','UB',1,'2025-11-21 00:00:00','PND','EMP001','NORMAL','Waiting for confirmation',NULL,0,'2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001',NULL,'2026-06-16 08:28:37',NULL,NULL,NULL,NULL,'OPEN'),(3,'BK2025003','CUS001',NULL,NULL,'CSMT','NDLS','2025-11-20 00:00:00','SL','GENERAL','MB',3,'2025-11-15 00:00:00','CAN','EMP001','NORMAL','Cancelled by customer',NULL,0,'2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001',NULL,'2026-06-16 08:28:37',NULL,NULL,NULL,NULL,'OPEN');
/*!40000 ALTER TABLE `bkXbooking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cuXcustomer`
--

DROP TABLE IF EXISTS `cuXcustomer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cuXcustomer` (
  `cu_cusid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer ID',
  `cu_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `cu_custno` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer Number',
  `cu_custtype` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'INDIVIDUAL' COMMENT 'Customer Type',
  `cu_compid` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Company ID (for corporate customers)',
  `cu_creditlimit` decimal(12,2) DEFAULT '0.00' COMMENT 'Credit Limit',
  `cu_creditdays` int DEFAULT '0' COMMENT 'Credit Days',
  `cu_discount` decimal(5,2) DEFAULT '0.00' COMMENT 'Discount Percentage',
  `cu_active` tinyint DEFAULT '1' COMMENT 'Active? (1=Active, 0=Inactive)',
  `cu_panno` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PAN Number',
  `cu_gstno` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GST Number',
  `entered_by` int DEFAULT NULL COMMENT 'Entered By User ID',
  `entered_on` datetime DEFAULT NULL COMMENT 'Entered On',
  `modified_by` int DEFAULT NULL COMMENT 'Modified By User ID',
  `modified_on` datetime DEFAULT NULL COMMENT 'Modified On',
  `status` enum('OPEN','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'OPEN',
  PRIMARY KEY (`cu_cusid`),
  UNIQUE KEY `cu_usid` (`cu_usid`),
  UNIQUE KEY `cu_custno` (`cu_custno`),
  CONSTRAINT `cuxcustomer_ibfk_1` FOREIGN KEY (`cu_usid`) REFERENCES `usXuser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cuXcustomer`
--

LOCK TABLES `cuXcustomer` WRITE;
/*!40000 ALTER TABLE `cuXcustomer` DISABLE KEYS */;
INSERT INTO `cuXcustomer` VALUES ('CUS001','CUS001','CUST001','INDIVIDUAL',NULL,10000.00,30,5.00,1,'ABCDE1234F',NULL,NULL,'2026-06-16 08:28:36',NULL,NULL,'OPEN'),('CUS002','CUS002','CUST002','INDIVIDUAL',NULL,15000.00,45,7.50,1,'MNOPQ1234P',NULL,NULL,'2026-06-16 08:28:36',NULL,NULL,'OPEN'),('CUS003','CUS003','CUST003','INDIVIDUAL',NULL,12000.00,30,5.00,1,'OPQRS2345Q',NULL,NULL,'2026-06-16 08:28:36',NULL,NULL,'OPEN'),('CUS004','CUS004','CUST004','CORPORATE',NULL,25000.00,60,10.00,1,'PQRST3456R',NULL,NULL,'2026-06-16 08:28:37',NULL,NULL,'OPEN'),('CUS005','CUS005','CUST005','INDIVIDUAL',NULL,8000.00,30,3.00,1,'QRSTU4567S',NULL,NULL,'2026-06-16 08:28:37',NULL,NULL,'OPEN'),('CUS006','CUS006','CUST006','INDIVIDUAL',NULL,20000.00,45,8.00,1,'RSTUV5678T',NULL,NULL,'2026-06-16 08:28:37',NULL,NULL,'OPEN');
/*!40000 ALTER TABLE `cuXcustomer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `emXemployee`
--

DROP TABLE IF EXISTS `emXemployee`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emXemployee` (
  `em_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Employee User ID',
  `em_empno` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Employee Number',
  `em_dept` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Employee Department',
  `em_salary` decimal(12,2) DEFAULT NULL COMMENT 'Employee Salary',
  `em_joindt` datetime NOT NULL COMMENT 'Join Date',
  `em_manager` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Manager User ID',
  `em_status` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT 'Employee Status',
  `em_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Address',
  `em_city` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'City',
  `em_state` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'State',
  `em_pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Pincode',
  `edtm` datetime NOT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entered By',
  `mdtm` datetime NOT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `cdtm` datetime DEFAULT NULL COMMENT 'Closed Date Time',
  `cby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Closed By',
  `em_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Employee Photo Path',
  PRIMARY KEY (`em_usid`),
  UNIQUE KEY `em_empno` (`em_empno`),
  KEY `em_manager` (`em_manager`),
  CONSTRAINT `emxemployee_ibfk_1` FOREIGN KEY (`em_usid`) REFERENCES `usXuser` (`us_usid`) ON UPDATE CASCADE,
  CONSTRAINT `emxemployee_ibfk_2` FOREIGN KEY (`em_manager`) REFERENCES `usXuser` (`us_usid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `emXemployee`
--

LOCK TABLES `emXemployee` WRITE;
/*!40000 ALTER TABLE `emXemployee` DISABLE KEYS */;
INSERT INTO `emXemployee` VALUES ('ACC001','ACC001','ACCOUNTS',45000.00,'2024-02-01 00:00:00','ADM001','ACTIVE','789 Accounts Street','Mumbai','Maharashtra','400003','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM',NULL,NULL,NULL),('EMP001','EMP001','AGENT',50000.00,'2024-01-15 00:00:00','ADM001','ACTIVE','456 Employee Street','Mumbai','Maharashtra','400002','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM',NULL,NULL,NULL),('EMP002','EMP002','HR',85000.00,'2023-06-15 00:00:00','ADM001','ACTIVE','456 MG Road','Mumbai','Maharashtra','400002','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM',NULL,NULL,NULL),('EMP003','EMP003','MARKETING',65000.00,'2023-08-20 00:00:00','ADM001','ACTIVE','789 Connaught Place','New Delhi','Delhi','110001','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM',NULL,NULL,NULL),('EMP004','EMP004','IT',75000.00,'2024-01-10 00:00:00','ADM001','ACTIVE','101 Brigade Road','Bangalore','Karnataka','560025','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM',NULL,NULL,NULL),('EMP005','EMP005','OPERATIONS',80000.00,'2023-11-05 00:00:00','ADM001','ACTIVE','202 T Nagar','Chennai','Tamil Nadu','600017','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM',NULL,NULL,NULL),('EMP006','EMP006','ACCOUNTS',60000.00,'2024-03-15 00:00:00','ACC001','ACTIVE','303 Civil Lines','Kolkata','West Bengal','700013','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM',NULL,NULL,NULL);
/*!40000 ALTER TABLE `emXemployee` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fnXfunction`
--

DROP TABLE IF EXISTS `fnXfunction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fnXfunction` (
  `fn_fnid` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Function Id.',
  `fn_fnshort` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Short Description',
  `fn_fndesc` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Description',
  `fn_rmrks` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `fn_active` tinyint NOT NULL DEFAULT '0' COMMENT 'Active ?',
  `fn_edtm` datetime DEFAULT NULL COMMENT 'Entered On',
  `fn_eby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Entered By',
  `fn_mdtm` datetime DEFAULT NULL COMMENT 'Modified On',
  `fn_mby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Modified By',
  `fn_cdtm` datetime DEFAULT NULL COMMENT 'Closed On',
  `fn_cby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Closed By',
  PRIMARY KEY (`fn_fnid`),
  UNIQUE KEY `fn_fnshort` (`fn_fnshort`),
  UNIQUE KEY `fn_xfunction_fn_fnshort` (`fn_fnshort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fnXfunction`
--

LOCK TABLES `fnXfunction` WRITE;
/*!40000 ALTER TABLE `fnXfunction` DISABLE KEYS */;
INSERT INTO `fnXfunction` VALUES ('ADM','Admin','Administrator',NULL,0,NULL,'',NULL,'',NULL,''),('AGT','Agent','Booking Agent',NULL,0,NULL,'',NULL,'',NULL,''),('EMP','Employee','Employee',NULL,0,NULL,'',NULL,'',NULL,'');
/*!40000 ALTER TABLE `fnXfunction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lgXlogin`
--

DROP TABLE IF EXISTS `lgXlogin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lgXlogin` (
  `lg_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `lg_email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email Address',
  `lg_passwd` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Password',
  `lg_salt` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Salt',
  `lg_lastlogin` datetime DEFAULT NULL COMMENT 'Last Login Date',
  `lg_failcount` int DEFAULT '0' COMMENT 'Failed Login Count',
  `lg_locked` tinyint DEFAULT '0' COMMENT 'Account Locked',
  `lg_pwdexp` datetime DEFAULT NULL COMMENT 'Password Expiry Date',
  `lg_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `lg_reset_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Password Reset Token',
  `lg_reset_token_expiry` datetime DEFAULT NULL COMMENT 'Password Reset Token Expiry',
  `lg_email_verified` tinyint DEFAULT '0' COMMENT 'Email Verified Status',
  `lg_verification_token` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email Verification Token',
  `lg_verification_token_expiry` datetime DEFAULT NULL COMMENT 'Email Verification Token Expiry',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`lg_usid`),
  UNIQUE KEY `lg_email` (`lg_email`),
  CONSTRAINT `lgxlogin_ibfk_1` FOREIGN KEY (`lg_usid`) REFERENCES `usXuser` (`us_usid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lgXlogin`
--

LOCK TABLES `lgXlogin` WRITE;
/*!40000 ALTER TABLE `lgXlogin` DISABLE KEYS */;
INSERT INTO `lgXlogin` VALUES ('ACC001','accounts@example.com','$2b$10$41sBaARBw9QOu1y4pYZ6XemIkd/uvcmAZEaXEhf170y3xs.FiZ3Hm','$2b$10$41sBaARBw9QOu1y4pYZ6Xe',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('ADM001','admin@example.com','$2b$10$0RV7Dd3K2b7DdS2pkC6F3u2UwIyfbP4OE2oHOd2PbYJjK7qeeHPDy','$2b$10$0RV7Dd3K2b7DdS2pkC6F3u',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('CUS001','customer@example.com','$2b$10$bR1lydCMeuNA2mOXMV0n9.vbDugUfA6JUH7GlhNKWPm5hiHMG/Ysi','$2b$10$bR1lydCMeuNA2mOXMV0n9.',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('CUS002','ankit.gupta@example.com','$2b$10$Ip1TSkRUHhEW3aHmqKXZBuJlY6BLi4r6SrlaGFT1jjAte3xZf7R5m','$2b$10$Ip1TSkRUHhEW3aHmqKXZBu',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('CUS003','priyanka.nair@example.com','$2b$10$JSptMdfXa4a/0q6QFrlDnO5oFVWQlpN8.zPUjKxuthSUybmkQ3T2K','$2b$10$JSptMdfXa4a/0q6QFrlDnO',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('CUS004','rajesh.mehta@example.com','$2b$10$pQG6n/dOi8e7boHZZpGLg.oQi1oMcCXoGdmUJcrRIbJnRquNEut.W','$2b$10$pQG6n/dOi8e7boHZZpGLg.',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:37','SYSTEM','2026-06-16 08:28:37','SYSTEM'),('CUS005','deepika.yadav@example.com','$2b$10$rwMpBIjlRmZEfTLLI23KVO4pHE0qCFJ7zBnasdcU.0djet6eq6miO','$2b$10$rwMpBIjlRmZEfTLLI23KVO',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:37','SYSTEM','2026-06-16 08:28:37','SYSTEM'),('CUS006','suresh.iyer@example.com','$2b$10$ApiiR/1H2WUlnYCBcQiExe/RRVBg5vpS/mMyn5q.dgpS1/VvFYmT6','$2b$10$ApiiR/1H2WUlnYCBcQiExe',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:37','SYSTEM','2026-06-16 08:28:37','SYSTEM'),('EMP001','employee@example.com','$2b$10$YWngiyuM4/vRtcSBpbLlAeOYR/dxmGgaqnN6QhfiiHxpLcSxZCE8y','$2b$10$YWngiyuM4/vRtcSBpbLlAe',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('EMP002','rahul.sharma@yatrasathi.com','$2b$10$8sRWDfpNmByySovS8uYHY.eiPNvVfnaCOwWLySA0KkS7FF7M1HNq.','$2b$10$8sRWDfpNmByySovS8uYHY.',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('EMP003','priya.patel@yatrasathi.com','$2b$10$a5c16YDmDHogTMo1o91qberBgEM05EGgBwEV9pzqe5pkt1Sh3Snz6','$2b$10$a5c16YDmDHogTMo1o91qbe',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('EMP004','amit.kumar@yatrasathi.com','$2b$10$ubOv2FaPke75Kj.X2DqQBuqBDpCqP9hmTWLXz7c.wZFVR2TOHtCCW','$2b$10$ubOv2FaPke75Kj.X2DqQBu',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('EMP005','sunita.reddy@yatrasathi.com','$2b$10$odpv3AQlfj7SZ9JjU7j8PePKqgVtkFBcJ5lSjXK9D3UbKIJoZU9tm','$2b$10$odpv3AQlfj7SZ9JjU7j8Pe',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('EMP006','vikram.singh@yatrasathi.com','$2b$10$fU/WL/a9NYyXvnLrmP8wNeQ03rv4j2DYdiyfArOzaZd/PA9bwpFhm','$2b$10$fU/WL/a9NYyXvnLrmP8wNe',NULL,0,0,NULL,1,NULL,NULL,1,NULL,NULL,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM');
/*!40000 ALTER TABLE `lgXlogin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ptXpayment`
--

DROP TABLE IF EXISTS `ptXpayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ptXpayment` (
  `pt_ptid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Payment ID (Primary Key)',
  `pt_custid` bigint NOT NULL COMMENT 'Customer ID (User ID)',
  `pt_totalamt` decimal(12,2) NOT NULL COMMENT 'Total Payment Amount',
  `pt_amount` decimal(12,2) NOT NULL COMMENT 'Payment Amount',
  `pt_status` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT 'RECEIVED' COMMENT 'Payment Status',
  `pt_verification_status` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT 'Verification Status: PENDING | VERIFIED | REJECTED',
  `pt_remarks` text COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `pt_acid` bigint NOT NULL COMMENT 'Account ID',
  `pt_mode` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Payment Mode',
  `pt_refno` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reference Number',
  `pt_paydt` datetime NOT NULL COMMENT 'Payment Date',
  `pt_rcvdt` datetime DEFAULT NULL COMMENT 'Received Date',
  `pt_allocatedamt` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'Allocated Amount',
  `pt_unallocamt` decimal(12,2) DEFAULT NULL COMMENT 'Unallocated Amount (generated field)',
  `pt_finyear` varchar(9) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Financial Year',
  `pt_period` varchar(7) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Accounting Period',
  `pt_locked` tinyint DEFAULT '0' COMMENT 'Lock Flag',
  `edtm` datetime NOT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entered By',
  `mdtm` datetime NOT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `pt_bkid` bigint DEFAULT NULL,
  `py_created_by` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`pt_ptid`),
  KEY `pt_acid` (`pt_acid`),
  KEY `pt_bkid` (`pt_bkid`),
  KEY `py_created_by` (`py_created_by`),
  CONSTRAINT `ptxpayment_ibfk_1` FOREIGN KEY (`pt_acid`) REFERENCES `acXaccount` (`ac_acid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ptxpayment_ibfk_2` FOREIGN KEY (`pt_bkid`) REFERENCES `bkXbooking` (`bk_bkid`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ptxpayment_ibfk_3` FOREIGN KEY (`py_created_by`) REFERENCES `usXuser` (`us_usid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ptXpayment`
--

LOCK TABLES `ptXpayment` WRITE;
/*!40000 ALTER TABLE `ptXpayment` DISABLE KEYS */;
INSERT INTO `ptXpayment` VALUES (1,1,5000.00,5000.00,'RECEIVED','PENDING','Full payment for confirmed booking',1,'ONLINE','TXN1234567890','2025-11-20 00:00:00','2025-11-20 00:00:00',0.00,NULL,'2025-26','2025-11',0,'2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001',1,NULL),(2,1,1000.00,1000.00,'RECEIVED','PENDING','Advance payment',2,'CASH',NULL,'2025-11-21 00:00:00','2025-11-21 00:00:00',0.00,NULL,'2025-26','2025-11',0,'2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001',2,NULL),(3,1,2400.00,2400.00,'REFUNDED','PENDING','Refund for cancelled booking',3,'ONLINE','TXN9876543210','2025-11-18 00:00:00','2025-11-19 00:00:00',0.00,NULL,'2025-26','2025-11',0,'2026-06-16 08:28:37','EMP001','2026-06-16 08:28:37','EMP001',3,NULL);
/*!40000 ALTER TABLE `ptXpayment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stXstation`
--

DROP TABLE IF EXISTS `stXstation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stXstation` (
  `st_stid` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Station ID',
  `st_stcode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Station Code',
  `st_stname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Station Name',
  `st_city` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'City',
  `st_state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'State',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`st_stid`),
  UNIQUE KEY `st_stcode` (`st_stcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stXstation`
--

LOCK TABLES `stXstation` WRITE;
/*!40000 ALTER TABLE `stXstation` DISABLE KEYS */;
INSERT INTO `stXstation` VALUES ('BLR','BLR','Bangalore City','Bangalore','Karnataka','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('CSMT','CSMT','Chhatrapati Shivaji Maharaj Terminus','Mumbai','Maharashtra','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('MAS','MAS','Chennai Central','Chennai','Tamil Nadu','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM'),('NDLS','NDLS','New Delhi','Delhi','Delhi','2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM');
/*!40000 ALTER TABLE `stXstation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usXuser`
--

DROP TABLE IF EXISTS `usXuser`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usXuser` (
  `us_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'User ID',
  `us_email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Email',
  `us_usname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'User Name',
  `us_title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Job Title',
  `us_phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Phone',
  `us_admin` tinyint NOT NULL DEFAULT '0' COMMENT 'Is Application Administrator?',
  `us_security` tinyint NOT NULL DEFAULT '0' COMMENT 'Is Security Administrator?',
  `us_limit` decimal(18,2) DEFAULT NULL COMMENT 'Authorization Limit',
  `us_rmrks` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `us_active` tinyint NOT NULL DEFAULT '0' COMMENT 'Active?',
  `us_edtm` datetime DEFAULT NULL COMMENT 'Entered On',
  `us_eby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Entered By',
  `us_mdtm` datetime DEFAULT NULL COMMENT 'Modified On',
  `us_mby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Modified By',
  `us_fname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'First Name',
  `us_lname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Last Name',
  `us_aadhaar` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Aadhaar Number',
  `us_pan` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'PAN Number',
  `us_addr1` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Address Line 1',
  `us_city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'City',
  `us_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'State',
  `us_pin` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'PIN Code',
  `us_usertype` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User Type',
  `us_roid` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Role ID',
  `us_coid` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Company ID',
  `us_appadmin` tinyint NOT NULL DEFAULT '0' COMMENT 'Application Administrator',
  `us_cdtm` datetime DEFAULT NULL COMMENT 'Closed On',
  `us_cby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Closed By',
  `us_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Employee Photo Path',
  PRIMARY KEY (`us_usid`),
  UNIQUE KEY `us_email` (`us_email`),
  UNIQUE KEY `us_xuser_us_email` (`us_email`),
  KEY `us_roid` (`us_roid`),
  KEY `us_coid` (`us_coid`),
  CONSTRAINT `usxuser_ibfk_1` FOREIGN KEY (`us_roid`) REFERENCES `fnXfunction` (`fn_fnid`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `usxuser_ibfk_2` FOREIGN KEY (`us_coid`) REFERENCES `coCompany` (`co_coid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usXuser`
--

LOCK TABLES `usXuser` WRITE;
/*!40000 ALTER TABLE `usXuser` DISABLE KEYS */;
INSERT INTO `usXuser` VALUES ('ACC001','accounts@example.com','','','6666666666',0,0,75000.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Robert','Johnson','345678901234','CDEFG3456H','789 Accounts Street','Mumbai','Maharashtra','400003','employee','ACC','TRV',0,NULL,'',NULL),('ADM001','admin@example.com','','','9999999999',0,0,100000.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Admin','User','123456789012','ABCDE1234F','123 Admin Street','Mumbai','Maharashtra','400001','admin','ADM','TRV',1,NULL,'',NULL),('CUS001','customer@example.com','','','8888888888',0,0,0.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','John','Doe','456789012345','DEFGH4567I','123 Customer Street','Mumbai','Maharashtra','400001','customer','CUS','TRV',0,NULL,'',NULL),('CUS002','ankit.gupta@example.com','','','9123456789',0,0,0.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Ankit','Gupta','112233445566','MNOPQ1234P','505 Nehru Place','New Delhi','Delhi','110019','customer','CUS','TRV',0,NULL,'',NULL),('CUS003','priyanka.nair@example.com','','','8234567890',0,0,0.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Priyanka','Nair','223344556677','OPQRS2345Q','606 MG Road','Bangalore','Karnataka','560001','customer','CUS','TRV',0,NULL,'',NULL),('CUS004','rajesh.mehta@example.com','','','7345678901',0,0,0.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Rajesh','Mehta','334455667788','PQRST3456R','707 Anna Nagar','Chennai','Tamil Nadu','600040','customer','CUS','TRV',0,NULL,'',NULL),('CUS005','deepika.yadav@example.com','','','6456789012',0,0,0.00,NULL,1,'2026-06-16 08:28:37','SYSTEM','2026-06-16 08:28:37','SYSTEM','Deepika','Yadav','445566778899','QRSTU4567S','808 Park Street','Kolkata','West Bengal','700016','customer','CUS','TRV',0,NULL,'',NULL),('CUS006','suresh.iyer@example.com','','','5567890123',0,0,0.00,NULL,1,'2026-06-16 08:28:37','SYSTEM','2026-06-16 08:28:37','SYSTEM','Suresh','Iyer','556677889900','RSTUV5678T','909 Banjara Hills','Hyderabad','Telangana','500034','customer','CUS','TRV',0,NULL,'',NULL),('EMP001','employee@example.com','','','7777777777',0,0,50000.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Jane','Smith','234567890123','BCDEF2345G','456 Employee Street','Mumbai','Maharashtra','400002','employee','AGT','TRV',0,NULL,'',NULL),('EMP002','rahul.sharma@yatrasathi.com','','','9876543210',0,0,50000.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Rahul','Sharma','567890123456','FGHIJ5678K','456 MG Road','Mumbai','Maharashtra','400002','employee','EMP','TRV',0,NULL,'',NULL),('EMP003','priya.patel@yatrasathi.com','','','8765432109',0,0,50000.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Priya','Patel','678901234567','GHIJK6789L','789 Connaught Place','New Delhi','Delhi','110001','employee','EMP','TRV',0,NULL,'',NULL),('EMP004','amit.kumar@yatrasathi.com','','','7654321098',0,0,50000.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Amit','Kumar','789012345678','HIJKL7890M','101 Brigade Road','Bangalore','Karnataka','560025','employee','EMP','TRV',0,NULL,'',NULL),('EMP005','sunita.reddy@yatrasathi.com','','','6543210987',0,0,50000.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Sunita','Reddy','890123456789','IJKLM8901N','202 T Nagar','Chennai','Tamil Nadu','600017','employee','EMP','TRV',0,NULL,'',NULL),('EMP006','vikram.singh@yatrasathi.com','','','5432109876',0,0,50000.00,NULL,1,'2026-06-16 08:28:36','SYSTEM','2026-06-16 08:28:36','SYSTEM','Vikram','Singh','901234567890','JKLMN9012O','303 Civil Lines','Kolkata','West Bengal','700013','employee','EMP','TRV',0,NULL,'',NULL);
/*!40000 ALTER TABLE `usXuser` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'TVL_001'
--

--
-- Dumping routines for database 'TVL_001'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-16 14:01:05
