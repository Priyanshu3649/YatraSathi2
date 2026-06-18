-- YatraSathi Database Backup
-- Database: TVL_001
-- Date: 2026-06-16T08:17:23.301Z

DROP TABLE IF EXISTS `acAccount`;
CREATE TABLE `acAccount` (
  `ac_acid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Account ID',
  `ac_bkid` bigint NOT NULL COMMENT 'Booking ID',
  `ac_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer User ID',
  `ac_totamt` decimal(15,2) DEFAULT '0.00' COMMENT 'Total Amount',
  `ac_rcvdamt` decimal(15,2) DEFAULT '0.00' COMMENT 'Received Amount',
  `ac_pendamt` decimal(15,2) DEFAULT '0.00' COMMENT 'Pending Amount',
  `ac_duedt` datetime DEFAULT NULL COMMENT 'Due Date',
  `ac_fyear` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Financial Year',
  `ac_status` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT 'PENDING' COMMENT 'Account Status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`ac_acid`),
  KEY `ac_bkid` (`ac_bkid`),
  KEY `ac_usid` (`ac_usid`),
  CONSTRAINT `acaccount_ibfk_1` FOREIGN KEY (`ac_bkid`) REFERENCES `bkXbooking` (`bk_bkid`) ON UPDATE CASCADE,
  CONSTRAINT `acaccount_ibfk_2` FOREIGN KEY (`ac_usid`) REFERENCES `cuCustomer` (`cu_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `acXaccount`;
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

INSERT INTO `acXaccount` (`ac_acid`, `ac_bkid`, `ac_usid`, `ac_totamt`, `ac_rcvdamt`, `ac_pendamt`, `ac_duedt`, `ac_fyear`, `ac_status`, `edtm`, `eby`, `mdtm`, `mby`) VALUES (1, 1, 'CUS001', '5000.00', '5000.00', '0.00', '2025-11-25 00:00:00.000', '2025-26', 'PAID', '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001');
INSERT INTO `acXaccount` (`ac_acid`, `ac_bkid`, `ac_usid`, `ac_totamt`, `ac_rcvdamt`, `ac_pendamt`, `ac_duedt`, `ac_fyear`, `ac_status`, `edtm`, `eby`, `mdtm`, `mby`) VALUES (2, 2, 'CUS001', '1000.00', '1000.00', '0.00', '2025-12-10 00:00:00.000', '2025-26', 'PAID', '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001');
INSERT INTO `acXaccount` (`ac_acid`, `ac_bkid`, `ac_usid`, `ac_totamt`, `ac_rcvdamt`, `ac_pendamt`, `ac_duedt`, `ac_fyear`, `ac_status`, `edtm`, `eby`, `mdtm`, `mby`) VALUES (3, 3, 'CUS001', '2400.00', '0.00', '2400.00', '2025-11-15 00:00:00.000', '2025-26', 'REFUNDED', '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001');

DROP TABLE IF EXISTS `apXapplication`;
CREATE TABLE `apXapplication` (
  `ap_apid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Application ID',
  `ap_apshort` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Short Name',
  `ap_apdesc` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Description',
  `ap_rmrks` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `ap_active` tinyint NOT NULL DEFAULT '0' COMMENT 'Active?',
  `ap_edtm` datetime DEFAULT NULL COMMENT 'Entered On',
  `ap_eby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Entered By',
  `ap_mdtm` datetime DEFAULT NULL COMMENT 'Modified On',
  `ap_mby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Modified By',
  `ap_cdtm` datetime DEFAULT NULL COMMENT 'Closed On',
  `ap_cby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Closed By',
  PRIMARY KEY (`ap_apid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `auAudit`;
CREATE TABLE `auAudit` (
  `au_auid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Audit ID',
  `au_table` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Table Name',
  `au_pkval` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Primary Key Value',
  `au_action` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Action Type',
  `au_oldval` json DEFAULT NULL COMMENT 'Old Values',
  `au_newval` json DEFAULT NULL COMMENT 'New Values',
  `au_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `au_ipaddr` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP Address',
  `au_edtm` datetime NOT NULL COMMENT 'Entry Date Time',
  PRIMARY KEY (`au_auid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `audit_forensic_log`;
CREATE TABLE `audit_forensic_log` (
  `audit_id` bigint NOT NULL AUTO_INCREMENT,
  `module_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_type` enum('INSERT','UPDATE','DELETE','CANCEL','CLOSE','LOGIN','LOGOUT','FAILED_LOGIN','PASSWORD_RESET','USER_LOCK','USER_UNLOCK','ROLE_CHANGE','PERMISSION_CHANGE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `old_value` longtext COLLATE utf8mb4_unicode_ci,
  `new_value` longtext COLLATE utf8mb4_unicode_ci,
  `changed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `changed_by_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `machine_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `change_timestamp` datetime NOT NULL,
  PRIMARY KEY (`audit_id`),
  KEY `audit_forensic_log_module_name` (`module_name`),
  KEY `audit_forensic_log_record_id` (`record_id`),
  KEY `audit_forensic_log_module_name_record_id` (`module_name`,`record_id`),
  KEY `audit_forensic_log_changed_by` (`changed_by`),
  KEY `audit_forensic_log_change_timestamp` (`change_timestamp`),
  KEY `audit_forensic_log_action_type` (`action_type`),
  CONSTRAINT `audit_forensic_log_ibfk_1` FOREIGN KEY (`changed_by`) REFERENCES `usXuser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `audit_forensic_log` (`audit_id`, `module_name`, `record_id`, `action_type`, `field_name`, `old_value`, `new_value`, `changed_by`, `changed_by_name`, `ip_address`, `machine_name`, `change_timestamp`) VALUES (1, 'Auth', 'ACC001', 'LOGIN', NULL, NULL, NULL, 'ACC001', 'Robert Johnson', '::ffff:127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-06-16 05:08:07.000');
INSERT INTO `audit_forensic_log` (`audit_id`, `module_name`, `record_id`, `action_type`, `field_name`, `old_value`, `new_value`, `changed_by`, `changed_by_name`, `ip_address`, `machine_name`, `change_timestamp`) VALUES (2, 'Auth', 'ACC001', 'LOGOUT', NULL, NULL, NULL, 'ACC001', 'Robert Johnson', '::ffff:127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-06-16 05:08:19.000');
INSERT INTO `audit_forensic_log` (`audit_id`, `module_name`, `record_id`, `action_type`, `field_name`, `old_value`, `new_value`, `changed_by`, `changed_by_name`, `ip_address`, `machine_name`, `change_timestamp`) VALUES (3, 'Auth', 'ADM001', 'LOGIN', NULL, NULL, NULL, 'ADM001', 'Admin User', '::ffff:127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-06-16 05:08:27.000');
INSERT INTO `audit_forensic_log` (`audit_id`, `module_name`, `record_id`, `action_type`, `field_name`, `old_value`, `new_value`, `changed_by`, `changed_by_name`, `ip_address`, `machine_name`, `change_timestamp`) VALUES (4, 'Auth', 'ADM001', 'LOGOUT', NULL, NULL, NULL, 'ADM001', 'Admin User', '::ffff:127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-06-16 08:06:14.000');
INSERT INTO `audit_forensic_log` (`audit_id`, `module_name`, `record_id`, `action_type`, `field_name`, `old_value`, `new_value`, `changed_by`, `changed_by_name`, `ip_address`, `machine_name`, `change_timestamp`) VALUES (5, 'Auth', 'ADM001', 'LOGIN', NULL, NULL, NULL, 'ADM001', 'Admin User', '::ffff:127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', '2026-06-16 08:06:17.000');

DROP TABLE IF EXISTS `billingMaster`;
CREATE TABLE `billingMaster` (
  `bl_id` int NOT NULL AUTO_INCREMENT,
  `bl_entry_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bl_bill_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_sub_bill_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_booking_id` bigint NOT NULL,
  `bl_booking_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_billing_date` datetime NOT NULL,
  `bl_journey_date` datetime NOT NULL,
  `bl_customer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bl_customer_phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bl_station_boy` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_from_station` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_to_station` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_train_no` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_class` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_pnr` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_seats_reserved` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_railway_fare` decimal(10,2) DEFAULT '0.00',
  `bl_sb_incentive` decimal(10,2) DEFAULT '0.00',
  `bl_gst` decimal(10,2) DEFAULT '0.00',
  `bl_misc_charges` decimal(10,2) DEFAULT '0.00',
  `bl_platform_fee` decimal(10,2) DEFAULT '0.00',
  `bl_service_charge` decimal(10,2) DEFAULT '0.00',
  `bl_delivery_charge` decimal(10,2) DEFAULT '0.00',
  `bl_surcharge` decimal(10,2) DEFAULT '0.00',
  `bl_discount` decimal(10,2) DEFAULT '0.00',
  `bl_gst_type` enum('INCLUSIVE','EXCLUSIVE') COLLATE utf8mb4_unicode_ci DEFAULT 'EXCLUSIVE',
  `bl_total_amount` decimal(12,2) NOT NULL,
  `bl_is_split` tinyint(1) DEFAULT '0',
  `bl_parent_bill_id` int DEFAULT NULL,
  `bl_created_by` int DEFAULT NULL,
  `bl_created_at` datetime DEFAULT NULL,
  `entered_by` int DEFAULT NULL COMMENT 'User ID who created the record',
  `entered_on` datetime DEFAULT NULL COMMENT 'Timestamp when record was created',
  `modified_by` int DEFAULT NULL COMMENT 'User ID who last modified the record',
  `modified_on` datetime DEFAULT NULL COMMENT 'Timestamp when record was last modified',
  `closed_by` int DEFAULT NULL COMMENT 'User ID who closed the record',
  `closed_on` datetime DEFAULT NULL COMMENT 'Timestamp when record was closed',
  `status` enum('OPEN','CLOSED') COLLATE utf8mb4_unicode_ci DEFAULT 'OPEN' COMMENT 'Record status',
  `bl_status` enum('CONFIRMED','PENDING','PAID') COLLATE utf8mb4_unicode_ci DEFAULT 'CONFIRMED' COMMENT 'Billing status',
  `bl_modified_at` datetime DEFAULT NULL,
  `bl_bill_date` date DEFAULT NULL,
  `is_cancelled` tinyint(1) DEFAULT '0',
  `cancelled_on` datetime DEFAULT NULL,
  `cancelled_by` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_cancel_charges` decimal(10,2) DEFAULT '0.00',
  `refund_amount` decimal(10,2) DEFAULT '0.00',
  PRIMARY KEY (`bl_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `bkXbooking`;
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
  UNIQUE KEY `bk_xbooking_bk_bkno` (`bk_bkno`),
  KEY `bk_usid` (`bk_usid`),
  CONSTRAINT `bkxbooking_ibfk_1` FOREIGN KEY (`bk_usid`) REFERENCES `cuXcustomer` (`cu_usid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bkXbooking` (`bk_bkid`, `bk_bkno`, `bk_usid`, `bk_phonenumber`, `bk_customername`, `bk_fromst`, `bk_tost`, `bk_trvldt`, `bk_class`, `bk_quota`, `bk_berthpref`, `bk_totalpass`, `bk_reqdt`, `bk_status`, `bk_agent`, `bk_priority`, `bk_remarks`, `bk_pnr`, `bk_billed`, `edtm`, `eby`, `mdtm`, `mby`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `closed_by`, `closed_on`, `status`) VALUES (1, 'BK2025001', 'CUS001', NULL, NULL, 'CSMT', 'NDLS', '2025-12-01 00:00:00.000', '3A', 'TATKAL', 'LB', 2, '2025-11-20 00:00:00.000', 'CNF', 'EMP001', 'HIGH', 'Business travel - confirmed booking', NULL, 0, '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001', NULL, '2026-06-14 15:27:51.000', NULL, NULL, NULL, NULL, 'OPEN');
INSERT INTO `bkXbooking` (`bk_bkid`, `bk_bkno`, `bk_usid`, `bk_phonenumber`, `bk_customername`, `bk_fromst`, `bk_tost`, `bk_trvldt`, `bk_class`, `bk_quota`, `bk_berthpref`, `bk_totalpass`, `bk_reqdt`, `bk_status`, `bk_agent`, `bk_priority`, `bk_remarks`, `bk_pnr`, `bk_billed`, `edtm`, `eby`, `mdtm`, `mby`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `closed_by`, `closed_on`, `status`) VALUES (2, 'BK2025002', 'CUS001', NULL, NULL, 'NDLS', 'BLR', '2025-12-15 00:00:00.000', '2A', 'TATKAL', 'UB', 1, '2025-11-21 00:00:00.000', 'PND', 'EMP001', 'NORMAL', 'Waiting for confirmation', NULL, 0, '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001', NULL, '2026-06-14 15:27:51.000', NULL, NULL, NULL, NULL, 'OPEN');
INSERT INTO `bkXbooking` (`bk_bkid`, `bk_bkno`, `bk_usid`, `bk_phonenumber`, `bk_customername`, `bk_fromst`, `bk_tost`, `bk_trvldt`, `bk_class`, `bk_quota`, `bk_berthpref`, `bk_totalpass`, `bk_reqdt`, `bk_status`, `bk_agent`, `bk_priority`, `bk_remarks`, `bk_pnr`, `bk_billed`, `edtm`, `eby`, `mdtm`, `mby`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `closed_by`, `closed_on`, `status`) VALUES (3, 'BK2025003', 'CUS001', NULL, NULL, 'CSMT', 'NDLS', '2025-11-20 00:00:00.000', 'SL', 'GENERAL', 'MB', 3, '2025-11-15 00:00:00.000', 'CAN', 'EMP001', 'NORMAL', 'Cancelled by customer', NULL, 0, '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001', NULL, '2026-06-14 15:27:51.000', NULL, NULL, NULL, NULL, 'OPEN');

DROP TABLE IF EXISTS `blXbilling`;
CREATE TABLE `blXbilling` (
  `bl_id` int NOT NULL AUTO_INCREMENT COMMENT 'Bill ID',
  `bl_entry_no` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entry Number',
  `bl_bill_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bill Number',
  `bl_sub_bill_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Sub Bill Number',
  `bl_booking_id` bigint NOT NULL COMMENT 'Booking ID (Foreign Key)',
  `bl_billing_date` datetime NOT NULL COMMENT 'Billing Date',
  `bl_journey_date` datetime NOT NULL COMMENT 'Journey Date',
  `bl_customer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer Name',
  `bl_customer_phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer Phone',
  `bl_station_boy` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Station Boy Name',
  `bl_from_station` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'From Station',
  `bl_to_station` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'To Station',
  `bl_train_no` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Train Number',
  `bl_class` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reservation Class',
  `bl_pnr` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PNR Number',
  `bl_seats_reserved` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Seats Reserved',
  `bl_railway_fare` decimal(10,2) DEFAULT '0.00' COMMENT 'Railway Fare',
  `bl_sb_incentive` decimal(10,2) DEFAULT '0.00' COMMENT 'Station Boy Incentive',
  `bl_gst` decimal(10,2) DEFAULT '0.00' COMMENT 'GST',
  `bl_misc_charges` decimal(10,2) DEFAULT '0.00' COMMENT 'Miscellaneous Charges',
  `bl_platform_fee` decimal(10,2) DEFAULT '0.00' COMMENT 'Platform Fee',
  `bl_service_charge` decimal(10,2) DEFAULT '0.00' COMMENT 'Service Charge',
  `bl_delivery_charge` decimal(10,2) DEFAULT '0.00' COMMENT 'Delivery Charge',
  `bl_surcharge` decimal(10,2) DEFAULT '0.00' COMMENT 'Surcharge',
  `bl_discount` decimal(10,2) DEFAULT '0.00' COMMENT 'Discount',
  `bl_gst_type` enum('INCLUSIVE','EXCLUSIVE','C') COLLATE utf8mb4_unicode_ci DEFAULT 'EXCLUSIVE' COMMENT 'GST Type',
  `bl_total_amount` decimal(12,2) NOT NULL COMMENT 'Total Amount',
  `bl_is_split` tinyint(1) DEFAULT '0' COMMENT 'Is Split Bill',
  `bl_parent_bill_id` int DEFAULT NULL COMMENT 'Parent Bill ID',
  `bl_created_by` int DEFAULT NULL COMMENT 'Created By User ID',
  `bl_created_at` datetime DEFAULT NULL COMMENT 'Created At',
  `entered_by` int DEFAULT NULL COMMENT 'User ID who created the record',
  `entered_on` datetime DEFAULT NULL COMMENT 'Timestamp when record was created',
  `modified_by` int DEFAULT NULL COMMENT 'User ID who last modified the record',
  `modified_on` datetime DEFAULT NULL COMMENT 'Timestamp when record was last modified',
  `closed_by` int DEFAULT NULL COMMENT 'User ID who closed the record',
  `closed_on` datetime DEFAULT NULL COMMENT 'Timestamp when record was closed',
  `status` enum('OPEN','CLOSED','CANCELLED','DRAFT','FINAL','PAID','CNF','CAN') COLLATE utf8mb4_unicode_ci DEFAULT 'OPEN' COMMENT 'Record status',
  `bl_railway_cancellation_charge` decimal(10,2) DEFAULT '0.00',
  `bl_agent_cancellation_charge` decimal(10,2) DEFAULT '0.00',
  `bl_station_boy_cancellation_charge` decimal(10,2) DEFAULT '0.00',
  `total_cancel_charges` decimal(10,2) DEFAULT '0.00',
  `refund_amount` decimal(10,2) DEFAULT '0.00',
  `payment_status` enum('UNPAID','PARTIALLY_PAID','FULLY_PAID','REFUND_DUE') COLLATE utf8mb4_unicode_ci DEFAULT 'UNPAID',
  `is_cancelled` tinyint(1) DEFAULT '0',
  `cancellation_date` datetime DEFAULT NULL,
  `cancelled_on` datetime DEFAULT NULL,
  `cancelled_by` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bl_cancellation_remarks` text COLLATE utf8mb4_unicode_ci,
  `bl_status` enum('DRAFT','CONFIRMED','CANCELLED','PENDING','PAID','FINAL','CNF','CAN') COLLATE utf8mb4_unicode_ci DEFAULT 'CNF' COMMENT 'Billing status',
  `bl_modified_at` datetime DEFAULT NULL,
  `bl_bill_date` date DEFAULT NULL,
  `bl_booking_no` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`bl_id`),
  KEY `bl_booking_id` (`bl_booking_id`),
  CONSTRAINT `blxbilling_ibfk_1` FOREIGN KEY (`bl_booking_id`) REFERENCES `bkXbooking` (`bk_bkid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `caCustomerAdvance`;
CREATE TABLE `caCustomerAdvance` (
  `ca_caid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Customer Advance ID',
  `ca_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer User ID',
  `ca_advance_amt` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Advance Amount (unallocated payment)',
  `ca_fyear` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Financial Year',
  `ca_last_updated` datetime NOT NULL COMMENT 'Last Updated Date',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`ca_caid`),
  UNIQUE KEY `ca_customer_advance_ca_usid_ca_fyear` (`ca_usid`,`ca_fyear`),
  KEY `ca_customer_advance_ca_usid` (`ca_usid`),
  KEY `ca_customer_advance_ca_fyear` (`ca_fyear`),
  CONSTRAINT `cacustomeradvance_ibfk_1` FOREIGN KEY (`ca_usid`) REFERENCES `cuCustomer` (`cu_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `caXcustomeradvance`;
CREATE TABLE `caXcustomeradvance` (
  `ca_caid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Customer Advance ID',
  `ca_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer User ID',
  `ca_advance_amt` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Advance Amount (unallocated payment)',
  `ca_fyear` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Financial Year',
  `ca_last_updated` datetime NOT NULL COMMENT 'Last Updated Date',
  `edtm` datetime NOT NULL COMMENT 'Entry Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entered By',
  `mdtm` datetime NOT NULL COMMENT 'Modification Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`ca_caid`),
  UNIQUE KEY `uk_ca_usid_fyear` (`ca_usid`,`ca_fyear`),
  KEY `idx_ca_usid` (`ca_usid`),
  KEY `idx_ca_fyear` (`ca_fyear`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ccCustContact`;
CREATE TABLE `ccCustContact` (
  `cc_ccid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Contact ID',
  `cc_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer User ID',
  `cc_fname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'First Name',
  `cc_lname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Last Name',
  `cc_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email Address',
  `cc_phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Phone Number',
  `cc_designation` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Designation',
  `cc_isprimary` tinyint DEFAULT '0' COMMENT 'Is Primary Contact',
  `cc_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`cc_ccid`),
  KEY `cc_usid` (`cc_usid`),
  CONSTRAINT `cccustcontact_ibfk_1` FOREIGN KEY (`cc_usid`) REFERENCES `cuCustomer` (`cu_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cfConfig`;
CREATE TABLE `cfConfig` (
  `cf_cfid` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Config ID',
  `cf_cfval` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Config Value',
  `cf_cfdesc` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Config Description',
  `cf_cftype` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'STRING' COMMENT 'Config Type',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`cf_cfid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cmpXmasterpassenger`;
CREATE TABLE `cmpXmasterpassenger` (
  `cmp_cmpid` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cmp_cuid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cmp_firstname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cmp_lastname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cmp_age` int NOT NULL,
  `cmp_gender` enum('M','F','O') COLLATE utf8mb4_unicode_ci NOT NULL,
  `cmp_berthpref` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cmp_idtype` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cmp_idnumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cmp_aadhaar` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cmp_active` tinyint NOT NULL DEFAULT '1',
  `cmp_created_by` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cmp_modified_by` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cmp_created_at` datetime NOT NULL,
  `cmp_modified_at` datetime NOT NULL,
  PRIMARY KEY (`cmp_cmpid`),
  KEY `cmp_cuid` (`cmp_cuid`),
  CONSTRAINT `cmpxmasterpassenger_ibfk_1` FOREIGN KEY (`cmp_cuid`) REFERENCES `cuXcustomer` (`cu_usid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `coCompany`;
CREATE TABLE `coCompany` (
  `co_coid` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Company ID',
  `co_coidb` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Base Company ID',
  `co_coshort` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Company Short Name',
  `co_codesc` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Company Description',
  `co_addr1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Address Line 1',
  `co_addr2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Address Line 2',
  `co_city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'City',
  `co_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'State',
  `co_pin` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PIN Code',
  `co_phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Phone Number',
  `co_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email Address',
  `co_gst` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GST Number',
  `co_pan` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PAN Number',
  `co_rmrks` text COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `co_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `co_cdtm` datetime DEFAULT NULL COMMENT 'Closed Date Time',
  `co_cby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Closed By',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`co_coid`),
  UNIQUE KEY `co_coshort` (`co_coshort`),
  UNIQUE KEY `co_company_co_coshort` (`co_coshort`),
  KEY `co_coidb` (`co_coidb`),
  CONSTRAINT `cocompany_ibfk_1` FOREIGN KEY (`co_coidb`) REFERENCES `coCompany` (`co_coid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ctXcontra`;
CREATE TABLE `ctXcontra` (
  `ct_ctid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Contra ID',
  `ct_entry_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Auto-generated entry number',
  `ct_date` date NOT NULL COMMENT 'Contra date',
  `ct_from_account` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Source account',
  `ct_to_account` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Destination account',
  `ct_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Contra amount',
  `ct_narration` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Narration/description',
  `ct_ref_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reference number',
  `ct_created_by` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID who created the contra entry',
  `ct_status` enum('Active','Inactive','Deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active' COMMENT 'Contra status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`ct_ctid`),
  UNIQUE KEY `ct_entry_no` (`ct_entry_no`),
  KEY `idx_ct_entry_no` (`ct_entry_no`),
  KEY `idx_ct_date` (`ct_date`),
  KEY `idx_ct_from_account` (`ct_from_account`),
  KEY `idx_ct_to_account` (`ct_to_account`),
  KEY `idx_ct_created_by` (`ct_created_by`),
  CONSTRAINT `ctxcontra_ibfk_1` FOREIGN KEY (`ct_created_by`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cuCorporateCustomer`;
CREATE TABLE `cuCorporateCustomer` (
  `cu_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `cu_custno` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer Number',
  `cu_company` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Company Name',
  `cu_gst` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GST Number',
  `cu_pan` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PAN Number',
  `cu_creditlmt` decimal(15,2) DEFAULT '0.00' COMMENT 'Credit Limit',
  `cu_creditused` decimal(15,2) DEFAULT '0.00' COMMENT 'Credit Used',
  `cu_paymentterms` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'IMMEDIATE' COMMENT 'Payment Terms',
  `cu_status` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT 'Customer Status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`cu_usid`),
  UNIQUE KEY `cu_custno` (`cu_custno`),
  UNIQUE KEY `cu_corporate_customer_cu_custno` (`cu_custno`),
  CONSTRAINT `cucorporatecustomer_ibfk_1` FOREIGN KEY (`cu_usid`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `cuCustomer`;
CREATE TABLE `cuCustomer` (
  `cu_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `cu_custno` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer Number',
  `cu_custtype` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer Type',
  `cu_company` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Company Name',
  `cu_gst` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'GST Number',
  `cu_creditlmt` decimal(15,2) DEFAULT '0.00' COMMENT 'Credit Limit',
  `cu_creditused` decimal(15,2) DEFAULT '0.00' COMMENT 'Credit Used',
  `cu_paymentterms` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'IMMEDIATE' COMMENT 'Payment Terms',
  `cu_status` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT 'Customer Status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`cu_usid`),
  UNIQUE KEY `cu_custno` (`cu_custno`),
  UNIQUE KEY `cu_customer_cu_custno` (`cu_custno`),
  CONSTRAINT `cucustomer_ibfk_1` FOREIGN KEY (`cu_usid`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `customer_ledger`;
CREATE TABLE `customer_ledger` (
  `ledger_id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entry_type` enum('BILL','PAYMENT','PAYMENT_REVERSAL','BILL_CANCELLED','ADJUSTMENT') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` bigint NOT NULL,
  `debit_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `credit_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `entry_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_by` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ledger_id`),
  KEY `idx_cl_customer_id` (`customer_id`),
  KEY `idx_cl_entry_type` (`entry_type`),
  KEY `idx_cl_reference` (`reference_type`,`reference_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_entry_type` (`entry_type`),
  KEY `idx_reference` (`reference_type`,`reference_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `customer_ledger` (`ledger_id`, `customer_id`, `entry_type`, `reference_type`, `reference_id`, `debit_amount`, `credit_amount`, `entry_date`, `remarks`, `created_by`, `created_at`) VALUES (1, '1', 'PAYMENT', 'PAYMENT', 1, '0.00', '5000.00', '2025-11-20 05:30:00.000', 'Legacy payment receipt: 1', 'EMP001', '2026-06-14 16:05:26.000');
INSERT INTO `customer_ledger` (`ledger_id`, `customer_id`, `entry_type`, `reference_type`, `reference_id`, `debit_amount`, `credit_amount`, `entry_date`, `remarks`, `created_by`, `created_at`) VALUES (2, '1', 'PAYMENT', 'PAYMENT', 2, '0.00', '1000.00', '2025-11-21 05:30:00.000', 'Legacy payment receipt: 2', 'EMP001', '2026-06-14 16:05:26.000');
INSERT INTO `customer_ledger` (`ledger_id`, `customer_id`, `entry_type`, `reference_type`, `reference_id`, `debit_amount`, `credit_amount`, `entry_date`, `remarks`, `created_by`, `created_at`) VALUES (3, '1', 'PAYMENT', 'PAYMENT', 3, '0.00', '2400.00', '2025-11-18 05:30:00.000', 'Legacy payment receipt: 3', 'EMP001', '2026-06-14 16:05:26.000');

DROP TABLE IF EXISTS `cuXcustomer`;
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

INSERT INTO `cuXcustomer` (`cu_cusid`, `cu_usid`, `cu_custno`, `cu_custtype`, `cu_compid`, `cu_creditlimit`, `cu_creditdays`, `cu_discount`, `cu_active`, `cu_panno`, `cu_gstno`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `status`) VALUES ('CUS001', 'CUS001', 'CUST001', 'INDIVIDUAL', NULL, '10000.00', 30, '5.00', 1, 'ABCDE1234F', NULL, NULL, '2026-06-14 15:27:50.000', NULL, NULL, 'OPEN');
INSERT INTO `cuXcustomer` (`cu_cusid`, `cu_usid`, `cu_custno`, `cu_custtype`, `cu_compid`, `cu_creditlimit`, `cu_creditdays`, `cu_discount`, `cu_active`, `cu_panno`, `cu_gstno`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `status`) VALUES ('CUS002', 'CUS002', 'CUST002', 'INDIVIDUAL', NULL, '15000.00', 45, '7.50', 1, 'MNOPQ1234P', NULL, NULL, '2026-06-14 15:27:51.000', NULL, NULL, 'OPEN');
INSERT INTO `cuXcustomer` (`cu_cusid`, `cu_usid`, `cu_custno`, `cu_custtype`, `cu_compid`, `cu_creditlimit`, `cu_creditdays`, `cu_discount`, `cu_active`, `cu_panno`, `cu_gstno`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `status`) VALUES ('CUS003', 'CUS003', 'CUST003', 'INDIVIDUAL', NULL, '12000.00', 30, '5.00', 1, 'OPQRS2345Q', NULL, NULL, '2026-06-14 15:27:51.000', NULL, NULL, 'OPEN');
INSERT INTO `cuXcustomer` (`cu_cusid`, `cu_usid`, `cu_custno`, `cu_custtype`, `cu_compid`, `cu_creditlimit`, `cu_creditdays`, `cu_discount`, `cu_active`, `cu_panno`, `cu_gstno`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `status`) VALUES ('CUS004', 'CUS004', 'CUST004', 'CORPORATE', NULL, '25000.00', 60, '10.00', 1, 'PQRST3456R', NULL, NULL, '2026-06-14 15:27:51.000', NULL, NULL, 'OPEN');
INSERT INTO `cuXcustomer` (`cu_cusid`, `cu_usid`, `cu_custno`, `cu_custtype`, `cu_compid`, `cu_creditlimit`, `cu_creditdays`, `cu_discount`, `cu_active`, `cu_panno`, `cu_gstno`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `status`) VALUES ('CUS005', 'CUS005', 'CUST005', 'INDIVIDUAL', NULL, '8000.00', 30, '3.00', 1, 'QRSTU4567S', NULL, NULL, '2026-06-14 15:27:51.000', NULL, NULL, 'OPEN');
INSERT INTO `cuXcustomer` (`cu_cusid`, `cu_usid`, `cu_custno`, `cu_custtype`, `cu_compid`, `cu_creditlimit`, `cu_creditdays`, `cu_discount`, `cu_active`, `cu_panno`, `cu_gstno`, `entered_by`, `entered_on`, `modified_by`, `modified_on`, `status`) VALUES ('CUS006', 'CUS006', 'CUST006', 'INDIVIDUAL', NULL, '20000.00', 45, '8.00', 1, 'RSTUV5678T', NULL, NULL, '2026-06-14 15:27:51.000', NULL, NULL, 'OPEN');

DROP TABLE IF EXISTS `emEmployee`;
CREATE TABLE `emEmployee` (
  `em_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `em_empno` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Employee Number',
  `em_dept` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Department',
  `em_salary` decimal(12,2) DEFAULT NULL COMMENT 'Salary',
  `em_joindt` datetime DEFAULT NULL COMMENT 'Join Date',
  `em_manager` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Manager User ID',
  `em_status` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'ACTIVE' COMMENT 'Employee Status',
  `em_address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Address',
  `em_city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'City',
  `em_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'State',
  `em_pincode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Pincode',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`em_usid`),
  UNIQUE KEY `em_empno` (`em_empno`),
  UNIQUE KEY `em_employee_em_empno` (`em_empno`),
  KEY `em_manager` (`em_manager`),
  CONSTRAINT `ememployee_ibfk_1` FOREIGN KEY (`em_usid`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE,
  CONSTRAINT `ememployee_ibfk_2` FOREIGN KEY (`em_manager`) REFERENCES `emEmployee` (`em_usid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `emXemployee`;
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
  CONSTRAINT `emxemployee_ibfk_2` FOREIGN KEY (`em_manager`) REFERENCES `emXemployee` (`em_usid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `emXemployee` (`em_usid`, `em_empno`, `em_dept`, `em_salary`, `em_joindt`, `em_manager`, `em_status`, `em_address`, `em_city`, `em_state`, `em_pincode`, `edtm`, `eby`, `mdtm`, `mby`, `cdtm`, `cby`, `em_photo`) VALUES ('ACC001', 'ACC001', 'ACCOUNTS', '45000.00', '2024-02-01 00:00:00.000', 'ADM001', 'ACTIVE', '789 Accounts Street', 'Mumbai', 'Maharashtra', '400003', '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', NULL, NULL, NULL);
INSERT INTO `emXemployee` (`em_usid`, `em_empno`, `em_dept`, `em_salary`, `em_joindt`, `em_manager`, `em_status`, `em_address`, `em_city`, `em_state`, `em_pincode`, `edtm`, `eby`, `mdtm`, `mby`, `cdtm`, `cby`, `em_photo`) VALUES ('EMP001', 'EMP001', 'AGENT', '50000.00', '2024-01-15 00:00:00.000', 'ADM001', 'ACTIVE', '456 Employee Street', 'Mumbai', 'Maharashtra', '400002', '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', NULL, NULL, NULL);
INSERT INTO `emXemployee` (`em_usid`, `em_empno`, `em_dept`, `em_salary`, `em_joindt`, `em_manager`, `em_status`, `em_address`, `em_city`, `em_state`, `em_pincode`, `edtm`, `eby`, `mdtm`, `mby`, `cdtm`, `cby`, `em_photo`) VALUES ('EMP002', 'EMP002', 'HR', '85000.00', '2023-06-15 00:00:00.000', 'ADM001', 'ACTIVE', '456 MG Road', 'Mumbai', 'Maharashtra', '400002', '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', NULL, NULL, NULL);
INSERT INTO `emXemployee` (`em_usid`, `em_empno`, `em_dept`, `em_salary`, `em_joindt`, `em_manager`, `em_status`, `em_address`, `em_city`, `em_state`, `em_pincode`, `edtm`, `eby`, `mdtm`, `mby`, `cdtm`, `cby`, `em_photo`) VALUES ('EMP003', 'EMP003', 'MARKETING', '65000.00', '2023-08-20 00:00:00.000', 'ADM001', 'ACTIVE', '789 Connaught Place', 'New Delhi', 'Delhi', '110001', '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', NULL, NULL, NULL);
INSERT INTO `emXemployee` (`em_usid`, `em_empno`, `em_dept`, `em_salary`, `em_joindt`, `em_manager`, `em_status`, `em_address`, `em_city`, `em_state`, `em_pincode`, `edtm`, `eby`, `mdtm`, `mby`, `cdtm`, `cby`, `em_photo`) VALUES ('EMP004', 'EMP004', 'IT', '75000.00', '2024-01-10 00:00:00.000', 'ADM001', 'ACTIVE', '101 Brigade Road', 'Bangalore', 'Karnataka', '560025', '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', NULL, NULL, NULL);
INSERT INTO `emXemployee` (`em_usid`, `em_empno`, `em_dept`, `em_salary`, `em_joindt`, `em_manager`, `em_status`, `em_address`, `em_city`, `em_state`, `em_pincode`, `edtm`, `eby`, `mdtm`, `mby`, `cdtm`, `cby`, `em_photo`) VALUES ('EMP005', 'EMP005', 'OPERATIONS', '80000.00', '2023-11-05 00:00:00.000', 'ADM001', 'ACTIVE', '202 T Nagar', 'Chennai', 'Tamil Nadu', '600017', '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', NULL, NULL, NULL);
INSERT INTO `emXemployee` (`em_usid`, `em_empno`, `em_dept`, `em_salary`, `em_joindt`, `em_manager`, `em_status`, `em_address`, `em_city`, `em_state`, `em_pincode`, `edtm`, `eby`, `mdtm`, `mby`, `cdtm`, `cby`, `em_photo`) VALUES ('EMP006', 'EMP006', 'ACCOUNTS', '60000.00', '2024-03-15 00:00:00.000', 'ACC001', 'ACTIVE', '303 Civil Lines', 'Kolkata', 'West Bengal', '700013', '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', NULL, NULL, NULL);

DROP TABLE IF EXISTS `fnXfunction`;
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

INSERT INTO `fnXfunction` (`fn_fnid`, `fn_fnshort`, `fn_fndesc`, `fn_rmrks`, `fn_active`, `fn_edtm`, `fn_eby`, `fn_mdtm`, `fn_mby`, `fn_cdtm`, `fn_cby`) VALUES ('ADM', 'Admin', 'Administrator', NULL, 0, NULL, '', NULL, '', NULL, '');
INSERT INTO `fnXfunction` (`fn_fnid`, `fn_fnshort`, `fn_fndesc`, `fn_rmrks`, `fn_active`, `fn_edtm`, `fn_eby`, `fn_mdtm`, `fn_mby`, `fn_cdtm`, `fn_cby`) VALUES ('AGT', 'Agent', 'Booking Agent', NULL, 0, NULL, '', NULL, '', NULL, '');
INSERT INTO `fnXfunction` (`fn_fnid`, `fn_fnshort`, `fn_fndesc`, `fn_rmrks`, `fn_active`, `fn_edtm`, `fn_eby`, `fn_mdtm`, `fn_mby`, `fn_cdtm`, `fn_cby`) VALUES ('EMP', 'Employee', 'Employee', NULL, 0, NULL, '', NULL, '', NULL, '');

DROP TABLE IF EXISTS `fpXfuncperm`;
CREATE TABLE `fpXfuncperm` (
  `fp_fnid` varchar(6) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Function/Role ID',
  `fp_opid` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Operation ID (ap_apid + mo_moid + op_opid)',
  `fp_allow` tinyint NOT NULL DEFAULT '0' COMMENT 'Allow? (1=Allow, 0=Deny)',
  `fp_rmrks` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `fp_active` tinyint NOT NULL DEFAULT '0' COMMENT 'Active?',
  `fp_edtm` datetime DEFAULT NULL COMMENT 'Entered On',
  `fp_eby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Entered By',
  `fp_mdtm` datetime DEFAULT NULL COMMENT 'Modified On',
  `fp_mby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Modified By',
  `fp_cdtm` datetime DEFAULT NULL COMMENT 'Closed On',
  `fp_cby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Closed By',
  PRIMARY KEY (`fp_fnid`,`fp_opid`),
  CONSTRAINT `fpxfuncperm_ibfk_1` FOREIGN KEY (`fp_fnid`) REFERENCES `fnXfunction` (`fn_fnid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `jeXjournal`;
CREATE TABLE `jeXjournal` (
  `je_jeid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Journal Entry ID',
  `je_entry_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Auto-generated entry number',
  `je_date` date NOT NULL COMMENT 'Journal entry date',
  `je_account` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Account name',
  `je_entry_type` enum('Debit','Credit') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entry type',
  `je_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Journal entry amount',
  `je_narration` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Narration/description',
  `je_ref_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reference number',
  `je_voucher_type` enum('Cash','Bank','Contra','Purchase','Sales','Journal') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Journal' COMMENT 'Voucher type',
  `je_created_by` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID who created the journal entry',
  `je_status` enum('Active','Inactive','Deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active' COMMENT 'Journal entry status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`je_jeid`),
  UNIQUE KEY `je_entry_no` (`je_entry_no`),
  KEY `idx_je_entry_no` (`je_entry_no`),
  KEY `idx_je_date` (`je_date`),
  KEY `idx_je_account` (`je_account`),
  KEY `idx_je_entry_type` (`je_entry_type`),
  KEY `idx_je_voucher_type` (`je_voucher_type`),
  KEY `idx_je_created_by` (`je_created_by`),
  CONSTRAINT `jexjournal_ibfk_1` FOREIGN KEY (`je_created_by`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lgLedger`;
CREATE TABLE `lgLedger` (
  `lg_lgid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Ledger ID (Primary Key)',
  `lg_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer User ID',
  `lg_entry_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entry Type: DEBIT (booking) | CREDIT (payment)',
  `lg_entry_ref` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entry Reference (PNR number / Payment ID / etc.)',
  `lg_amount` decimal(15,2) NOT NULL COMMENT 'Transaction Amount',
  `lg_opening_bal` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Opening Balance (before this transaction)',
  `lg_closing_bal` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Closing Balance (after this transaction)',
  `lg_pnid` bigint DEFAULT NULL COMMENT 'PNR ID (if entry is related to PNR)',
  `lg_ptid` bigint DEFAULT NULL COMMENT 'Payment ID (if entry is related to payment)',
  `lg_paid` bigint DEFAULT NULL COMMENT 'Payment Allocation ID (if entry is from allocation)',
  `lg_fyear` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Financial Year',
  `lg_remarks` text COLLATE utf8mb4_unicode_ci COMMENT 'Ledger Entry Remarks',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `lg_acid` bigint DEFAULT NULL,
  PRIMARY KEY (`lg_lgid`),
  KEY `lg_acid` (`lg_acid`),
  KEY `lg_ledger_lg_usid` (`lg_usid`),
  KEY `lg_ledger_lg_entry_type` (`lg_entry_type`),
  KEY `lg_ledger_lg_pnid` (`lg_pnid`),
  KEY `lg_ledger_lg_ptid` (`lg_ptid`),
  KEY `lg_ledger_lg_fyear` (`lg_fyear`),
  KEY `lg_ledger_edtm` (`edtm`),
  CONSTRAINT `lgledger_ibfk_1` FOREIGN KEY (`lg_pnid`) REFERENCES `pnXpnr` (`pn_pnid`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `lgledger_ibfk_2` FOREIGN KEY (`lg_ptid`) REFERENCES `ptXpayment` (`pt_ptid`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `lgledger_ibfk_3` FOREIGN KEY (`lg_acid`) REFERENCES `acAccount` (`ac_acid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lgLogin`;
CREATE TABLE `lgLogin` (
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
  UNIQUE KEY `lg_login_lg_email` (`lg_email`),
  CONSTRAINT `lglogin_ibfk_1` FOREIGN KEY (`lg_usid`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `lgXlogin`;
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
  UNIQUE KEY `lg_email` (`lg_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('ACC001', 'accounts@example.com', '$2b$10$1CK.OHBF5qOLhhP5JhE6keo6rtjbInvkPE3xp8ZsmoVJNlmB.ggbe', '$2b$10$1CK.OHBF5qOLhhP5JhE6ke', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('ADM001', 'admin@example.com', '$2b$10$XwJYCZwbZeR7bUMKXwGQuuRDmSUreau4v8KTGdNYiIZsavwNMzzvO', '$2b$10$XwJYCZwbZeR7bUMKXwGQuu', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('CUS001', 'customer@example.com', '$2b$10$m8/v/WSaOkxuqK7TMADpM.8bxmEaiP84l8iFjrbErjP9U0ng1qACG', '$2b$10$m8/v/WSaOkxuqK7TMADpM.', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('CUS002', 'ankit.gupta@example.com', '$2b$10$Szf.FbfRQE5t2xiEEvZG..i6sdAvqRws5zqCt7dizyM73rqQndC4a', '$2b$10$Szf.FbfRQE5t2xiEEvZG..', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('CUS003', 'priyanka.nair@example.com', '$2b$10$A63jCkDOjQLMmt/e4rbFSuY7pCT//Awp0wLXLUVCUqljbQxZxvDcu', '$2b$10$A63jCkDOjQLMmt/e4rbFSu', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('CUS004', 'rajesh.mehta@example.com', '$2b$10$AeVzXHSrKrcvNzZplf/0PO1.AeTCD1sUcjGVKmfEVoIuLH8C.ycua', '$2b$10$AeVzXHSrKrcvNzZplf/0PO', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('CUS005', 'deepika.yadav@example.com', '$2b$10$t7..43Pyn0oGdV3UiHnKk.6MPLU0ZRNVIO.GgjjmJ0UWuuq3nl/Fa', '$2b$10$t7..43Pyn0oGdV3UiHnKk.', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('CUS006', 'suresh.iyer@example.com', '$2b$10$mWA/2x/RonU0LqwBei1sNeyTK/M7gkLAhiIa.x5c2hc7MDKYnEjuK', '$2b$10$mWA/2x/RonU0LqwBei1sNe', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('EMP001', 'employee@example.com', '$2b$10$LPCN8bit.RB4nvqZTFTX2.hgdlvFLR4k1slcHwua5diu/pAtw48jG', '$2b$10$LPCN8bit.RB4nvqZTFTX2.', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('EMP002', 'rahul.sharma@yatrasathi.com', '$2b$10$dyWwNtWgMZL6xwRRXjnDT.HrrNJaINr458O5LLFbyN.8cUot0Noea', '$2b$10$dyWwNtWgMZL6xwRRXjnDT.', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('EMP003', 'priya.patel@yatrasathi.com', '$2b$10$UhXlLAZInEjkfDeVsHr.ee0dhBrIRGKIkY95nzKTr5ZnwQhy1y0bm', '$2b$10$UhXlLAZInEjkfDeVsHr.ee', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('EMP004', 'amit.kumar@yatrasathi.com', '$2b$10$BDn/MPIe/pQ9mQpf/HOapuUGDTqV8GsGz70TiyaUIOd7jeb.f19ym', '$2b$10$BDn/MPIe/pQ9mQpf/HOapu', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('EMP005', 'sunita.reddy@yatrasathi.com', '$2b$10$MADzlT/uRMNsIuLBKqQeRegZjMi8fclAQ3CctpF.tfH74mxTZcCpa', '$2b$10$MADzlT/uRMNsIuLBKqQeRe', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');
INSERT INTO `lgXlogin` (`lg_usid`, `lg_email`, `lg_passwd`, `lg_salt`, `lg_lastlogin`, `lg_failcount`, `lg_locked`, `lg_pwdexp`, `lg_active`, `lg_reset_token`, `lg_reset_token_expiry`, `lg_email_verified`, `lg_verification_token`, `lg_verification_token_expiry`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('EMP006', 'vikram.singh@yatrasathi.com', '$2b$10$OjnkWFn1UR4q9GPVDP0w..r7q0GxI1lJ/oPD0qPMFuTa12Eeu8UjO', '$2b$10$OjnkWFn1UR4q9GPVDP0w..', NULL, 0, 0, NULL, 1, NULL, NULL, 1, NULL, NULL, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM');

DROP TABLE IF EXISTS `mlXmasterlist`;
CREATE TABLE `mlXmasterlist` (
  `ml_mlid` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ml_cuid` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ml_firstname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ml_lastname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ml_age` int NOT NULL,
  `ml_gender` enum('M','F','O') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ml_berthpref` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ml_idtype` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ml_idnumber` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ml_aadhaar` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ml_active` tinyint NOT NULL DEFAULT '1',
  `ml_created_by` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ml_modified_by` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ml_created_at` datetime NOT NULL,
  `ml_modified_at` datetime NOT NULL,
  PRIMARY KEY (`ml_mlid`),
  KEY `ml_cuid` (`ml_cuid`),
  CONSTRAINT `mlxmasterlist_ibfk_1` FOREIGN KEY (`ml_cuid`) REFERENCES `cuXcustomer` (`cu_usid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `moXmodule`;
CREATE TABLE `moXmodule` (
  `mo_apid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Application ID',
  `mo_moid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Module ID',
  `mo_moshort` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Short Name',
  `mo_modesc` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Description',
  `mo_group` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Group',
  `mo_grsrl` int DEFAULT NULL COMMENT 'Group Serial',
  `mo_mhint` varchar(320) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Module Hint',
  `mo_isform` tinyint NOT NULL DEFAULT '0' COMMENT 'Is Form?',
  `mo_ready` tinyint NOT NULL DEFAULT '0' COMMENT 'Ready?',
  `mo_rmrks` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `mo_active` tinyint NOT NULL DEFAULT '0' COMMENT 'Active?',
  `mo_edtm` datetime DEFAULT NULL COMMENT 'Entered On',
  `mo_eby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Entered By',
  `mo_mdtm` datetime DEFAULT NULL COMMENT 'Modified On',
  `mo_mby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Modified By',
  `mo_cdtm` datetime DEFAULT NULL COMMENT 'Closed On',
  `mo_cby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Closed By',
  PRIMARY KEY (`mo_apid`,`mo_moid`),
  CONSTRAINT `moxmodule_ibfk_1` FOREIGN KEY (`mo_apid`) REFERENCES `apXapplication` (`ap_apid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `opXoperation`;
CREATE TABLE `opXoperation` (
  `op_apid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Application ID',
  `op_moid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Module ID',
  `op_opid` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Operation ID',
  `op_opshort` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Short Description',
  `op_opdesc` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Description',
  `op_appop` tinyint NOT NULL DEFAULT '0' COMMENT 'Application Operation?',
  `op_avail` tinyint NOT NULL DEFAULT '0' COMMENT 'Available?',
  `op_ready` tinyint NOT NULL DEFAULT '0' COMMENT 'Ready?',
  `op_rmrks` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `op_active` tinyint NOT NULL DEFAULT '0' COMMENT 'Active?',
  `op_edtm` datetime DEFAULT NULL COMMENT 'Entered On',
  `op_eby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Entered By',
  `op_mdtm` datetime DEFAULT NULL COMMENT 'Modified On',
  `op_mby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Modified By',
  `op_cdtm` datetime DEFAULT NULL COMMENT 'Closed On',
  `op_cby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Closed By',
  `op_secure` tinyint NOT NULL DEFAULT '1' COMMENT 'Secure?',
  PRIMARY KEY (`op_apid`,`op_moid`,`op_opid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `paXpayalloc`;
CREATE TABLE `paXpayalloc` (
  `pa_paid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Payment Allocation ID (Primary Key)',
  `pa_ptid` bigint NOT NULL COMMENT 'Payment ID (Foreign Key to ptXpayment)',
  `pa_pnid` bigint NOT NULL COMMENT 'PNR ID (Foreign Key to pnXpnr)',
  `pa_pnr` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PNR Number (for quick reference and validation)',
  `pa_allocamt` decimal(12,2) NOT NULL COMMENT 'Allocated Amount (must be <= PNR pending amount)',
  `pa_allocdt` datetime NOT NULL COMMENT 'Allocation Date',
  `pa_status` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVE' COMMENT 'Allocation Status',
  `pa_rmrks` text COLLATE utf8mb4_unicode_ci COMMENT 'Allocation Remarks',
  `edtm` datetime NOT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entered By (User ID who made the allocation)',
  `mdtm` datetime NOT NULL COMMENT 'Modification Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`pa_paid`),
  KEY `idx_pa_ptid` (`pa_ptid`),
  KEY `idx_pa_pnid` (`pa_pnid`),
  KEY `idx_pa_pnr` (`pa_pnr`),
  KEY `idx_pa_allocdt` (`pa_allocdt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `payment_allocations`;
CREATE TABLE `payment_allocations` (
  `allocation_id` int NOT NULL AUTO_INCREMENT,
  `payment_id` bigint NOT NULL,
  `bill_id` int NOT NULL,
  `allocated_amount` decimal(12,2) NOT NULL,
  `allocation_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_by` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`allocation_id`),
  KEY `idx_pa_payment_id` (`payment_id`),
  KEY `idx_pa_bill_id` (`bill_id`),
  KEY `idx_payment` (`payment_id`),
  KEY `idx_bill` (`bill_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `pnXpnr`;
CREATE TABLE `pnXpnr` (
  `pn_pnid` bigint NOT NULL AUTO_INCREMENT COMMENT 'PNR ID',
  `pn_bkid` bigint NOT NULL COMMENT 'Booking ID',
  `pn_pnrnum` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PNR Number',
  `pn_trid` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Train ID',
  `pn_trvldt` datetime NOT NULL COMMENT 'Travel Date',
  `pn_class` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Travel Class',
  `pn_quota` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Quota',
  `pn_passengers` int NOT NULL COMMENT 'Number of Passengers',
  `pn_status` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT 'CNF' COMMENT 'PNR Status',
  `pn_bookdt` datetime DEFAULT NULL COMMENT 'Booking Date',
  `pn_chartdt` datetime DEFAULT NULL COMMENT 'Chart Preparation Date',
  `pn_bkgamt` decimal(12,2) DEFAULT '0.00' COMMENT 'Booking Amount',
  `pn_svcamt` decimal(12,2) DEFAULT '0.00' COMMENT 'Service Charge',
  `pn_totamt` decimal(12,2) DEFAULT '0.00' COMMENT 'Total Amount',
  `pn_paidamt` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Paid Amount (calculated from allocations - DO NOT UPDATE MANUALLY)',
  `pn_pendingamt` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Pending Amount (pn_totamt - pn_paidamt - calculated real-time)',
  `pn_payment_status` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UNPAID' COMMENT 'Payment Status: UNPAID | PARTIAL | PAID (calculated automatically)',
  `pn_closed_flag` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT 'Closed Flag: Y (closed) | N (open) - for year-end closing',
  `pn_fyear` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Financial Year (for year-end closing)',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`pn_pnid`),
  UNIQUE KEY `pn_pnrnum` (`pn_pnrnum`),
  UNIQUE KEY `pn_xpnr_pn_pnrnum` (`pn_pnrnum`),
  KEY `pn_bkid` (`pn_bkid`),
  KEY `pn_trid` (`pn_trid`),
  CONSTRAINT `pnxpnr_ibfk_1` FOREIGN KEY (`pn_bkid`) REFERENCES `bkXbooking` (`bk_bkid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pnxpnr_ibfk_2` FOREIGN KEY (`pn_trid`) REFERENCES `trTrain` (`tr_trid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `psXpassenger`;
CREATE TABLE `psXpassenger` (
  `ps_psid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Passenger ID',
  `ps_bkid` bigint NOT NULL COMMENT 'Booking ID',
  `ps_fname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'First Name',
  `ps_lname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Last Name',
  `ps_age` int NOT NULL COMMENT 'Age',
  `ps_gender` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Gender',
  `ps_berthpref` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Berth Preference',
  `ps_berthalloc` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Berth Allocated',
  `ps_seatno` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Seat Number',
  `ps_coach` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Coach',
  `ps_aadhaar` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Aadhaar Number',
  `ps_idtype` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID Type',
  `ps_idno` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID Number',
  `ps_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `edtm` datetime NOT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entered By',
  `mdtm` datetime NOT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`ps_psid`),
  KEY `ps_bkid` (`ps_bkid`),
  CONSTRAINT `psxpassenger_ibfk_1` FOREIGN KEY (`ps_bkid`) REFERENCES `bkXbooking` (`bk_bkid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ptXpayment`;
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
  PRIMARY KEY (`pt_ptid`),
  KEY `pt_acid` (`pt_acid`),
  KEY `pt_bkid` (`pt_bkid`),
  CONSTRAINT `ptxpayment_ibfk_1` FOREIGN KEY (`pt_acid`) REFERENCES `acAccount` (`ac_acid`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ptxpayment_ibfk_2` FOREIGN KEY (`pt_bkid`) REFERENCES `bkXbooking` (`bk_bkid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `ptXpayment` (`pt_ptid`, `pt_custid`, `pt_totalamt`, `pt_amount`, `pt_status`, `pt_verification_status`, `pt_remarks`, `pt_acid`, `pt_mode`, `pt_refno`, `pt_paydt`, `pt_rcvdt`, `pt_allocatedamt`, `pt_unallocamt`, `pt_finyear`, `pt_period`, `pt_locked`, `edtm`, `eby`, `mdtm`, `mby`, `pt_bkid`) VALUES (1, 1, '5000.00', '5000.00', 'RECEIVED', 'PENDING', 'Full payment for confirmed booking', 1, 'ONLINE', 'TXN1234567890', '2025-11-20 00:00:00.000', '2025-11-20 00:00:00.000', '0.00', NULL, '2025-26', '2025-11', 0, '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001', 1);
INSERT INTO `ptXpayment` (`pt_ptid`, `pt_custid`, `pt_totalamt`, `pt_amount`, `pt_status`, `pt_verification_status`, `pt_remarks`, `pt_acid`, `pt_mode`, `pt_refno`, `pt_paydt`, `pt_rcvdt`, `pt_allocatedamt`, `pt_unallocamt`, `pt_finyear`, `pt_period`, `pt_locked`, `edtm`, `eby`, `mdtm`, `mby`, `pt_bkid`) VALUES (2, 1, '1000.00', '1000.00', 'RECEIVED', 'PENDING', 'Advance payment', 2, 'CASH', NULL, '2025-11-21 00:00:00.000', '2025-11-21 00:00:00.000', '0.00', NULL, '2025-26', '2025-11', 0, '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001', 2);
INSERT INTO `ptXpayment` (`pt_ptid`, `pt_custid`, `pt_totalamt`, `pt_amount`, `pt_status`, `pt_verification_status`, `pt_remarks`, `pt_acid`, `pt_mode`, `pt_refno`, `pt_paydt`, `pt_rcvdt`, `pt_allocatedamt`, `pt_unallocamt`, `pt_finyear`, `pt_period`, `pt_locked`, `edtm`, `eby`, `mdtm`, `mby`, `pt_bkid`) VALUES (3, 1, '2400.00', '2400.00', 'REFUNDED', 'PENDING', 'Refund for cancelled booking', 3, 'ONLINE', 'TXN9876543210', '2025-11-18 00:00:00.000', '2025-11-19 00:00:00.000', '0.00', NULL, '2025-26', '2025-11', 0, '2026-06-14 15:27:51.000', 'EMP001', '2026-06-14 15:27:51.000', 'EMP001', 3);

DROP TABLE IF EXISTS `pyXpayment`;
CREATE TABLE `pyXpayment` (
  `py_pymtid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Payment ID',
  `py_entry_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Auto-generated entry number',
  `py_date` date NOT NULL COMMENT 'Payment date',
  `py_entry_type` enum('Debit','Credit') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entry type',
  `py_customer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Customer name',
  `py_customer_phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Customer phone',
  `py_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Payment amount',
  `py_ref_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reference number',
  `py_bank_account` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bank account name',
  `py_balance` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Current balance',
  `py_total_credit` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Total credit amount',
  `py_total_debit` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Total debit amount',
  `py_created_by` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID who created the payment',
  `py_status` enum('Active','Inactive','Deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active' COMMENT 'Payment status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `entered_by` int DEFAULT NULL COMMENT 'Entered By User ID',
  `entered_on` datetime DEFAULT NULL COMMENT 'Entered On',
  `modified_by` int DEFAULT NULL COMMENT 'Modified By User ID',
  `modified_on` datetime DEFAULT NULL COMMENT 'Modified On',
  `closed_by` int DEFAULT NULL COMMENT 'Closed By User ID',
  `closed_on` datetime DEFAULT NULL COMMENT 'Closed On',
  `status` enum('OPEN','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'OPEN' COMMENT 'Record Status',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`py_pymtid`),
  UNIQUE KEY `py_entry_no` (`py_entry_no`),
  KEY `idx_py_entry_no` (`py_entry_no`),
  KEY `idx_py_date` (`py_date`),
  KEY `idx_py_customer_phone` (`py_customer_phone`),
  KEY `idx_py_created_by` (`py_created_by`),
  KEY `idx_py_status` (`py_status`),
  CONSTRAINT `pyxpayment_ibfk_1` FOREIGN KEY (`py_created_by`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rcXreceipt`;
CREATE TABLE `rcXreceipt` (
  `rc_rcid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Receipt ID',
  `rc_entry_no` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Auto-generated entry number',
  `rc_date` date NOT NULL COMMENT 'Receipt date',
  `rc_customer_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Customer name',
  `rc_customer_phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Customer phone',
  `rc_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'Receipt amount',
  `rc_payment_mode` enum('Cash','Bank','Cheque','Online') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Cash' COMMENT 'Payment mode',
  `rc_ref_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Reference number',
  `rc_bank_account` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bank account name',
  `rc_narration` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Narration/description',
  `rc_created_by` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID who created the receipt',
  `rc_status` enum('Active','Inactive','Deleted') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Active' COMMENT 'Receipt status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `entered_by` int DEFAULT NULL COMMENT 'Entered By User ID',
  `entered_on` datetime DEFAULT NULL COMMENT 'Entered On',
  `modified_by` int DEFAULT NULL COMMENT 'Modified By User ID',
  `modified_on` datetime DEFAULT NULL COMMENT 'Modified On',
  `closed_by` int DEFAULT NULL COMMENT 'Closed By User ID',
  `closed_on` datetime DEFAULT NULL COMMENT 'Closed On',
  `status` enum('OPEN','CLOSED','CANCELLED') COLLATE utf8mb4_unicode_ci DEFAULT 'OPEN' COMMENT 'Record Status',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`rc_rcid`),
  UNIQUE KEY `rc_entry_no` (`rc_entry_no`),
  KEY `idx_rc_entry_no` (`rc_entry_no`),
  KEY `idx_rc_date` (`rc_date`),
  KEY `idx_rc_customer_phone` (`rc_customer_phone`),
  KEY `idx_rc_payment_mode` (`rc_payment_mode`),
  KEY `idx_rc_created_by` (`rc_created_by`),
  CONSTRAINT `rcxreceipt_ibfk_1` FOREIGN KEY (`rc_created_by`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rpRolePermission`;
CREATE TABLE `rpRolePermission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `rp_roid` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Role ID',
  `rp_peid` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Permission ID',
  `rp_canview` tinyint DEFAULT '1' COMMENT 'Can View',
  `rp_canadd` tinyint DEFAULT '0' COMMENT 'Can Add',
  `rp_canmod` tinyint DEFAULT '0' COMMENT 'Can Modify',
  `rp_candel` tinyint DEFAULT '0' COMMENT 'Can Delete',
  `rp_limit` decimal(15,2) DEFAULT '0.00' COMMENT 'Transaction Limit',
  `rp_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`id`),
  UNIQUE KEY `rp_role_permission_rp_roid_rp_peid` (`rp_roid`,`rp_peid`),
  CONSTRAINT `rprolepermission_ibfk_1` FOREIGN KEY (`rp_roid`) REFERENCES `fnXfunction` (`fn_fnid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `rtXreporttemplate`;
CREATE TABLE `rtXreporttemplate` (
  `rt_rtid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Report Template ID',
  `rt_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Template name',
  `rt_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Template description',
  `rt_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Report type (booking, billing, payment, etc.)',
  `rt_config` json NOT NULL COMMENT 'JSON configuration for the report',
  `rt_role_access` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'private' COMMENT 'Role access level (private, role-specific, public)',
  `rt_created_by` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID who created the template',
  `rt_is_public` tinyint NOT NULL DEFAULT '0' COMMENT 'Whether template is public (1) or private (0)',
  `rt_is_active` tinyint NOT NULL DEFAULT '1' COMMENT 'Whether template is active (1) or archived (0)',
  `rt_usage_count` int NOT NULL DEFAULT '0' COMMENT 'Number of times template has been used',
  `rt_last_used` datetime DEFAULT NULL COMMENT 'Last time template was used',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`rt_rtid`),
  KEY `idx_rt_created_by` (`rt_created_by`),
  KEY `idx_rt_type` (`rt_type`),
  KEY `idx_rt_role_access` (`rt_role_access`),
  KEY `idx_rt_is_public` (`rt_is_public`),
  KEY `idx_rt_is_active` (`rt_is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `service_charges`;
CREATE TABLE `service_charges` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `customer_id` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Customer ID from UserTVL/CustomerTVL',
  `service_type` enum('RESERVATION','CANCELLATION') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RESERVATION',
  `travel_class` enum('SL','3A','2A','1A','CC','2S') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Reservation class',
  `charge_mode` enum('FIXED','PER_PASSENGER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIXED',
  `passenger_min` int NOT NULL DEFAULT '1',
  `passenger_max` int DEFAULT NULL COMMENT 'NULL means no upper limit (e.g. 6+)',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `entered_by` int DEFAULT NULL,
  `entered_on` datetime DEFAULT NULL,
  `modified_by` int DEFAULT NULL,
  `modified_on` datetime DEFAULT NULL,
  `closed_by` int DEFAULT NULL,
  `closed_on` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `service_charges_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `cuCustomer` (`cu_usid`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `service_charges_default`;
CREATE TABLE `service_charges_default` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `service_type` enum('RESERVATION','CANCELLATION') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RESERVATION',
  `travel_class` enum('SL','3A','2A','1A','CC','2S') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Reservation class',
  `charge_mode` enum('FIXED','PER_PASSENGER') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'FIXED',
  `passenger_min` int NOT NULL DEFAULT '1',
  `passenger_max` int DEFAULT NULL COMMENT 'NULL means no upper limit (e.g. 6+)',
  `amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) DEFAULT '1',
  `entered_by` int DEFAULT NULL,
  `entered_on` datetime DEFAULT NULL,
  `modified_by` int DEFAULT NULL,
  `modified_on` datetime DEFAULT NULL,
  `closed_by` int DEFAULT NULL,
  `closed_on` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `ssSession`;
CREATE TABLE `ssSession` (
  `ss_start` datetime NOT NULL COMMENT 'Session Start Time',
  `ss_ssid` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Session ID',
  `ss_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `ss_coid` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Company ID',
  `ss_ipaddr` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'IP Address',
  `ss_useragent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User Agent',
  `ss_token` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Session Token (JWT can be long)',
  `ss_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `ss_lastact` datetime DEFAULT NULL COMMENT 'Last Activity',
  `ss_end` datetime DEFAULT NULL COMMENT 'Session End Time',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`ss_start`,`ss_ssid`,`ss_usid`),
  KEY `ss_usid` (`ss_usid`),
  KEY `ss_coid` (`ss_coid`),
  CONSTRAINT `sssession_ibfk_1` FOREIGN KEY (`ss_usid`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE,
  CONSTRAINT `sssession_ibfk_2` FOREIGN KEY (`ss_coid`) REFERENCES `coCompany` (`co_coid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stStation`;
CREATE TABLE `stStation` (
  `st_stid` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Station ID',
  `st_stcode` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Station Code',
  `st_stname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Station Name',
  `st_city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'City',
  `st_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'State',
  `st_zone` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Railway Zone',
  `st_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`st_stid`),
  UNIQUE KEY `st_stcode` (`st_stcode`),
  UNIQUE KEY `st_station_st_stcode` (`st_stcode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `stXstation`;
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

INSERT INTO `stXstation` (`st_stid`, `st_stcode`, `st_stname`, `st_city`, `st_state`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('BLR', 'BLR', 'Bangalore City', 'Bangalore', 'Karnataka', '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');
INSERT INTO `stXstation` (`st_stid`, `st_stcode`, `st_stname`, `st_city`, `st_state`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('CSMT', 'CSMT', 'Chhatrapati Shivaji Maharaj Terminus', 'Mumbai', 'Maharashtra', '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');
INSERT INTO `stXstation` (`st_stid`, `st_stcode`, `st_stname`, `st_city`, `st_state`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('MAS', 'MAS', 'Chennai Central', 'Chennai', 'Tamil Nadu', '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');
INSERT INTO `stXstation` (`st_stid`, `st_stcode`, `st_stname`, `st_city`, `st_state`, `edtm`, `eby`, `mdtm`, `mby`) VALUES ('NDLS', 'NDLS', 'New Delhi', 'Delhi', 'Delhi', '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM');

DROP TABLE IF EXISTS `tpTravelPlan`;
CREATE TABLE `tpTravelPlan` (
  `tp_tpid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Travel Plan ID',
  `tp_title` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Travel Plan Title',
  `tp_description` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Travel Plan Description',
  `tp_startdate` datetime NOT NULL COMMENT 'Start Date',
  `tp_enddate` datetime NOT NULL COMMENT 'End Date',
  `tp_destination` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Destination',
  `tp_budget` decimal(12,2) NOT NULL COMMENT 'Budget',
  `tp_activities` text COLLATE utf8mb4_unicode_ci COMMENT 'Activities',
  `tp_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `tp_ispublic` tinyint DEFAULT '0' COMMENT 'Is Public (0 = private, 1 = public)',
  `tp_sharedwith` text COLLATE utf8mb4_unicode_ci COMMENT 'Shared With User IDs (JSON array)',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`tp_tpid`),
  KEY `tp_usid` (`tp_usid`),
  CONSTRAINT `tptravelplan_ibfk_1` FOREIGN KEY (`tp_usid`) REFERENCES `usUser` (`us_usid`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trTrain`;
CREATE TABLE `trTrain` (
  `tr_trid` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Train ID',
  `tr_trno` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Train Number',
  `tr_trname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Train Name',
  `tr_fromst` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'From Station',
  `tr_tost` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'To Station',
  `tr_deptime` time DEFAULT NULL COMMENT 'Departure Time',
  `tr_arrtime` time DEFAULT NULL COMMENT 'Arrival Time',
  `tr_distance` decimal(8,2) DEFAULT NULL COMMENT 'Distance',
  `tr_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`tr_trid`),
  UNIQUE KEY `tr_trno` (`tr_trno`),
  UNIQUE KEY `tr_train_tr_trno` (`tr_trno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `trXtrain`;
CREATE TABLE `trXtrain` (
  `tr_trid` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Train ID',
  `tr_trno` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Train Number',
  `tr_trname` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Train Name',
  `tr_fromst` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'From Station Code',
  `tr_tost` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'To Station Code',
  `tr_days` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Days of Operation (7-char string)',
  `tr_ac1` int DEFAULT '0' COMMENT 'AC First Class Seats',
  `tr_ac2` int DEFAULT '0' COMMENT 'AC Second Class Seats',
  `tr_ac3` int DEFAULT '0' COMMENT 'AC Third Class Seats',
  `tr_sl` int DEFAULT '0' COMMENT 'Sleeper Class Seats',
  `tr_gen` int DEFAULT '0' COMMENT 'General Seats',
  `tr_ac1fare` decimal(10,2) DEFAULT NULL COMMENT 'AC First Class Fare',
  `tr_ac2fare` decimal(10,2) DEFAULT NULL COMMENT 'AC Second Class Fare',
  `tr_ac3fare` decimal(10,2) DEFAULT NULL COMMENT 'AC Third Class Fare',
  `tr_slfare` decimal(10,2) DEFAULT NULL COMMENT 'Sleeper Class Fare',
  `tr_genfare` decimal(10,2) DEFAULT NULL COMMENT 'General Fare',
  `tr_active` tinyint DEFAULT '1' COMMENT 'Active? (1=Active, 0=Inactive)',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`tr_trid`),
  UNIQUE KEY `tr_trno` (`tr_trno`),
  KEY `tr_fromst` (`tr_fromst`),
  KEY `tr_tost` (`tr_tost`),
  CONSTRAINT `trxtrain_ibfk_1` FOREIGN KEY (`tr_fromst`) REFERENCES `stXstation` (`st_stcode`) ON UPDATE CASCADE,
  CONSTRAINT `trxtrain_ibfk_2` FOREIGN KEY (`tr_tost`) REFERENCES `stXstation` (`st_stcode`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `upXusrperm`;
CREATE TABLE `upXusrperm` (
  `up_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'User ID',
  `up_opid` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT 'Operation ID (ap_apid + mo_moid + op_opid)',
  `up_allow` tinyint NOT NULL DEFAULT '0' COMMENT 'Allow? (1=Allow, 0=Deny)',
  `up_rmrks` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `up_active` tinyint NOT NULL DEFAULT '0' COMMENT 'Active?',
  `up_edtm` datetime DEFAULT NULL COMMENT 'Entered On',
  `up_eby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Entered By',
  `up_mdtm` datetime DEFAULT NULL COMMENT 'Modified On',
  `up_mby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Modified By',
  `up_cdtm` datetime DEFAULT NULL COMMENT 'Closed On',
  `up_cby` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT 'Closed By',
  PRIMARY KEY (`up_usid`,`up_opid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `usUser`;
CREATE TABLE `usUser` (
  `us_usid` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User ID',
  `us_fname` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'First Name',
  `us_lname` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Last Name',
  `us_email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email Address',
  `us_phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Phone Number',
  `us_aadhaar` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Aadhaar Number',
  `us_pan` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PAN Number',
  `us_addr1` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Address Line 1',
  `us_addr2` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Address Line 2',
  `us_city` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'City',
  `us_state` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'State',
  `us_pin` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'PIN Code',
  `us_usertype` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'User Type',
  `us_roid` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Role ID',
  `us_coid` varchar(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Company ID',
  `us_active` tinyint DEFAULT '1' COMMENT 'Active Status',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`us_usid`),
  UNIQUE KEY `us_email` (`us_email`),
  UNIQUE KEY `us_phone` (`us_phone`),
  UNIQUE KEY `us_user_us_email` (`us_email`),
  UNIQUE KEY `us_user_us_phone` (`us_phone`),
  UNIQUE KEY `us_aadhaar` (`us_aadhaar`),
  UNIQUE KEY `us_user_us_aadhaar` (`us_aadhaar`),
  KEY `us_roid` (`us_roid`),
  KEY `us_coid` (`us_coid`),
  CONSTRAINT `ususer_ibfk_1` FOREIGN KEY (`us_roid`) REFERENCES `fnXfunction` (`fn_fnid`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ususer_ibfk_2` FOREIGN KEY (`us_coid`) REFERENCES `coCompany` (`co_coid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `usXuser`;
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
  CONSTRAINT `usxuser_ibfk_1` FOREIGN KEY (`us_roid`) REFERENCES `fnXfunction` (`fn_fnid`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('ACC001', 'accounts@example.com', '', '', '6666666666', 0, 0, '75000.00', NULL, 1, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', 'Robert', 'Johnson', '345678901234', 'CDEFG3456H', '789 Accounts Street', 'Mumbai', 'Maharashtra', '400003', 'employee', 'ACC', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('ADM001', 'admin@example.com', '', '', '9999999999', 0, 0, '100000.00', NULL, 1, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', 'Admin', 'User', '123456789012', 'ABCDE1234F', '123 Admin Street', 'Mumbai', 'Maharashtra', '400001', 'admin', 'ADM', 'TRV', 1, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('CUS001', 'customer@example.com', '', '', '8888888888', 0, 0, '0.00', NULL, 1, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', 'John', 'Doe', '456789012345', 'DEFGH4567I', '123 Customer Street', 'Mumbai', 'Maharashtra', '400001', 'customer', 'CUS', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('CUS002', 'ankit.gupta@example.com', '', '', '9123456789', 0, 0, '0.00', NULL, 1, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', 'Ankit', 'Gupta', '112233445566', 'MNOPQ1234P', '505 Nehru Place', 'New Delhi', 'Delhi', '110019', 'customer', 'CUS', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('CUS003', 'priyanka.nair@example.com', '', '', '8234567890', 0, 0, '0.00', NULL, 1, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', 'Priyanka', 'Nair', '223344556677', 'OPQRS2345Q', '606 MG Road', 'Bangalore', 'Karnataka', '560001', 'customer', 'CUS', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('CUS004', 'rajesh.mehta@example.com', '', '', '7345678901', 0, 0, '0.00', NULL, 1, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', 'Rajesh', 'Mehta', '334455667788', 'PQRST3456R', '707 Anna Nagar', 'Chennai', 'Tamil Nadu', '600040', 'customer', 'CUS', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('CUS005', 'deepika.yadav@example.com', '', '', '6456789012', 0, 0, '0.00', NULL, 1, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', 'Deepika', 'Yadav', '445566778899', 'QRSTU4567S', '808 Park Street', 'Kolkata', 'West Bengal', '700016', 'customer', 'CUS', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('CUS006', 'suresh.iyer@example.com', '', '', '5567890123', 0, 0, '0.00', NULL, 1, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', 'Suresh', 'Iyer', '556677889900', 'RSTUV5678T', '909 Banjara Hills', 'Hyderabad', 'Telangana', '500034', 'customer', 'CUS', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('EMP001', 'employee@example.com', '', '', '7777777777', 0, 0, '50000.00', NULL, 1, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', 'Jane', 'Smith', '234567890123', 'BCDEF2345G', '456 Employee Street', 'Mumbai', 'Maharashtra', '400002', 'employee', 'AGT', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('EMP002', 'rahul.sharma@yatrasathi.com', '', '', '9876543210', 0, 0, '50000.00', NULL, 1, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', 'Rahul', 'Sharma', '567890123456', 'FGHIJ5678K', '456 MG Road', 'Mumbai', 'Maharashtra', '400002', 'employee', 'EMP', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('EMP003', 'priya.patel@yatrasathi.com', '', '', '8765432109', 0, 0, '50000.00', NULL, 1, '2026-06-14 15:27:50.000', 'SYSTEM', '2026-06-14 15:27:50.000', 'SYSTEM', 'Priya', 'Patel', '678901234567', 'GHIJK6789L', '789 Connaught Place', 'New Delhi', 'Delhi', '110001', 'employee', 'EMP', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('EMP004', 'amit.kumar@yatrasathi.com', '', '', '7654321098', 0, 0, '50000.00', NULL, 1, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', 'Amit', 'Kumar', '789012345678', 'HIJKL7890M', '101 Brigade Road', 'Bangalore', 'Karnataka', '560025', 'employee', 'EMP', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('EMP005', 'sunita.reddy@yatrasathi.com', '', '', '6543210987', 0, 0, '50000.00', NULL, 1, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', 'Sunita', 'Reddy', '890123456789', 'IJKLM8901N', '202 T Nagar', 'Chennai', 'Tamil Nadu', '600017', 'employee', 'EMP', 'TRV', 0, NULL, '', NULL);
INSERT INTO `usXuser` (`us_usid`, `us_email`, `us_usname`, `us_title`, `us_phone`, `us_admin`, `us_security`, `us_limit`, `us_rmrks`, `us_active`, `us_edtm`, `us_eby`, `us_mdtm`, `us_mby`, `us_fname`, `us_lname`, `us_aadhaar`, `us_pan`, `us_addr1`, `us_city`, `us_state`, `us_pin`, `us_usertype`, `us_roid`, `us_coid`, `us_appadmin`, `us_cdtm`, `us_cby`, `us_photo`) VALUES ('EMP006', 'vikram.singh@yatrasathi.com', '', '', '5432109876', 0, 0, '50000.00', NULL, 1, '2026-06-14 15:27:51.000', 'SYSTEM', '2026-06-14 15:27:51.000', 'SYSTEM', 'Vikram', 'Singh', '901234567890', 'JKLMN9012O', '303 Civil Lines', 'Kolkata', 'West Bengal', '700013', 'employee', 'EMP', 'TRV', 0, NULL, '', NULL);

DROP TABLE IF EXISTS `yeXyearendclosing`;
CREATE TABLE `yeXyearendclosing` (
  `ye_yeid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Year End ID',
  `ye_fyear` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Financial Year',
  `ye_closing_date` datetime NOT NULL COMMENT 'Closing Date',
  `ye_total_pending_receivables` decimal(15,2) NOT NULL COMMENT 'Total Pending Receivables',
  `ye_total_advance_balance` decimal(15,2) NOT NULL COMMENT 'Total Advance Balance',
  `ye_total_customers` int NOT NULL COMMENT 'Total Customers',
  `ye_total_pending_pnrs` int NOT NULL COMMENT 'Total Pending PNRs',
  `ye_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Status',
  `ye_remarks` text COLLATE utf8mb4_unicode_ci COMMENT 'Remarks',
  `edtm` datetime NOT NULL COMMENT 'Entry Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Entered By',
  `mdtm` datetime NOT NULL COMMENT 'Modification Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`ye_yeid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `yeYearEndClosing`;
CREATE TABLE `yeYearEndClosing` (
  `ye_yeid` bigint NOT NULL AUTO_INCREMENT COMMENT 'Year-End Closing ID',
  `ye_fyear` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Financial Year (e.g., 2023-24)',
  `ye_closing_date` datetime NOT NULL COMMENT 'Year-End Closing Date (typically March 31)',
  `ye_total_pending_receivables` decimal(15,2) DEFAULT '0.00' COMMENT 'Total Pending Receivables (sum of all pending PNRs)',
  `ye_total_advance_balance` decimal(15,2) DEFAULT '0.00' COMMENT 'Total Advance Balance (sum of all customer advances)',
  `ye_total_customers` int DEFAULT '0' COMMENT 'Total Number of Customers with Outstanding',
  `ye_total_pending_pnrs` int DEFAULT '0' COMMENT 'Total Number of Pending PNRs',
  `ye_status` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DRAFT' COMMENT 'Status: DRAFT | FINALIZED | CARRY_FORWARDED',
  `ye_remarks` text COLLATE utf8mb4_unicode_ci COMMENT 'Closing Remarks',
  `edtm` datetime DEFAULT NULL COMMENT 'Entered Date Time',
  `eby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Entered By',
  `mdtm` datetime DEFAULT NULL COMMENT 'Modified Date Time',
  `mby` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Modified By',
  PRIMARY KEY (`ye_yeid`),
  UNIQUE KEY `ye_year_end_closing_ye_fyear` (`ye_fyear`),
  KEY `ye_year_end_closing_ye_closing_date` (`ye_closing_date`),
  KEY `ye_year_end_closing_ye_status` (`ye_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

