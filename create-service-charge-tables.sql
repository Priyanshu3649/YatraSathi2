-- Create Service Charge Tables
-- These tables handle dynamic, rule-based pricing for reservations and cancellations.

CREATE TABLE IF NOT EXISTS service_charges (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    customer_id BIGINT NOT NULL,
    service_type ENUM('RESERVATION', 'CANCELLATION') NOT NULL DEFAULT 'RESERVATION',
    travel_class ENUM('SL', '3A', '2A', '1A', 'CC', '2S') NOT NULL,
    charge_mode ENUM('FIXED', 'PER_PASSENGER') NOT NULL DEFAULT 'FIXED',
    passenger_min INT NOT NULL DEFAULT 1,
    passenger_max INT DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit Fields
    entered_by INT NULL,
    entered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INT NULL,
    modified_on TIMESTAMP NULL,
    closed_by INT NULL,
    closed_on TIMESTAMP NULL,
    
    INDEX (customer_id),
    INDEX (service_type),
    INDEX (travel_class),
    INDEX (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_charges_default (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    service_type ENUM('RESERVATION', 'CANCELLATION') NOT NULL DEFAULT 'RESERVATION',
    travel_class ENUM('SL', '3A', '2A', '1A', 'CC', '2S') NOT NULL,
    charge_mode ENUM('FIXED', 'PER_PASSENGER') NOT NULL DEFAULT 'FIXED',
    passenger_min INT NOT NULL DEFAULT 1,
    passenger_max INT DEFAULT NULL,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Audit Fields
    entered_by INT NULL,
    entered_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_by INT NULL,
    modified_on TIMESTAMP NULL,
    closed_by INT NULL,
    closed_on TIMESTAMP NULL,
    
    INDEX (service_type),
    INDEX (travel_class),
    INDEX (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
