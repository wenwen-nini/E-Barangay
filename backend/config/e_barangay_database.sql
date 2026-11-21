CREATE DATABASE IF NOT EXISTS e_barangay
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE e_barangay;

CREATE TABLE IF NOT EXISTS `User` (
    user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Resident', 'Staff') NOT NULL,
    account_status ENUM('Active', 'Disabled', 'Suspended')
        NOT NULL DEFAULT 'Active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    notify_request_updates BOOLEAN NOT NULL DEFAULT TRUE,
    notify_pickup_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    notify_announcements BOOLEAN NOT NULL DEFAULT FALSE,
    profile_image_path VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Resident (
    resident_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    name_extension VARCHAR(20) NULL,
    birth_date DATE NOT NULL,
    complete_address VARCHAR(500) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    CONSTRAINT fk_resident_user
        FOREIGN KEY (user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Staff (
    staff_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NOT NULL,
    name_extension VARCHAR(20) NULL,
    position VARCHAR(100) NOT NULL,
    CONSTRAINT fk_staff_user
        FOREIGN KEY (user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Document (
    document_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT NULL,
    fee_per_copy DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estimated_processing_days INT UNSIGNED NOT NULL,
    availability ENUM('Available', 'Unavailable')
        NOT NULL DEFAULT 'Available',
    document_preview_path VARCHAR(500) NULL,
    CONSTRAINT chk_document_fee CHECK (fee_per_copy >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Requirement (
    requirement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id INT UNSIGNED NOT NULL,
    requirement_name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_requirement_document
        FOREIGN KEY (document_id) REFERENCES Document(document_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_requirement_document (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Request` (
    request_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    resident_id INT UNSIGNED NOT NULL,
    document_id INT UNSIGNED NOT NULL,
    assigned_staff_id INT UNSIGNED NULL,
    number_of_copies INT UNSIGNED NOT NULL DEFAULT 1,
    purpose VARCHAR(500) NOT NULL,
    request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM(
        'Pending',
        'Under Review',
        'Approved',
        'Rejected',
        'Returned',
        'Released',
        'Cancelled'
    ) NOT NULL DEFAULT 'Pending',
    approval_date DATETIME NULL,
    release_date DATETIME NULL,
    valid_id_presented BOOLEAN NOT NULL DEFAULT FALSE,
    identity_matched BOOLEAN NOT NULL DEFAULT FALSE,
    document_and_copies_verified BOOLEAN NOT NULL DEFAULT FALSE,
    collection_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_request_resident
        FOREIGN KEY (resident_id) REFERENCES Resident(resident_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_request_document
        FOREIGN KEY (document_id) REFERENCES Document(document_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_request_assigned_staff
        FOREIGN KEY (assigned_staff_id) REFERENCES Staff(staff_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_request_copies CHECK (number_of_copies >= 1),
    INDEX idx_request_resident (resident_id),
    INDEX idx_request_document (document_id),
    INDEX idx_request_staff (assigned_staff_id),
    INDEX idx_request_status (status),
    INDEX idx_request_date (request_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Request_Status_History (
    history_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id INT UNSIGNED NOT NULL,
    changed_by_user_id INT UNSIGNED NULL,
    status ENUM(
        'Pending',
        'Under Review',
        'Approved',
        'Rejected',
        'Returned',
        'Released',
        'Cancelled'
    ) NOT NULL,
    remarks TEXT NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_request
        FOREIGN KEY (request_id) REFERENCES `Request`(request_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_history_user
        FOREIGN KEY (changed_by_user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_history_request (request_id),
    INDEX idx_history_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Uploaded_Requirements (
    uploaded_requirement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    request_id INT UNSIGNED NOT NULL,
    requirement_id INT UNSIGNED NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL,
    uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_uploaded_request
        FOREIGN KEY (request_id) REFERENCES `Request`(request_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_uploaded_requirement
        FOREIGN KEY (requirement_id) REFERENCES Requirement(requirement_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_uploaded_request (request_id),
    INDEX idx_uploaded_requirement (requirement_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Announcement (
    announcement_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    staff_id INT UNSIGNED NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    published_at DATETIME NULL,
    expires_at DATETIME NULL,
    status ENUM('Draft', 'Published', 'Archived')
        NOT NULL DEFAULT 'Draft',
    CONSTRAINT fk_announcement_staff
        FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_announcement_status (status),
    INDEX idx_announcement_published_at (published_at),
    INDEX idx_announcement_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS Notification (
    notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    request_id INT UNSIGNED NULL,
    announcement_id INT UNSIGNED NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notification_user
        FOREIGN KEY (user_id) REFERENCES `User`(user_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_notification_request
        FOREIGN KEY (request_id) REFERENCES `Request`(request_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_notification_announcement
        FOREIGN KEY (announcement_id) REFERENCES Announcement(announcement_id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_notification_user_read (user_id, is_read),
    INDEX idx_notification_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW TABLES;
