-- YatraSathi Candidates for Deletion Backup
-- Database: TVL_001
-- Date: 2026-06-16T08:17:23.303Z

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

