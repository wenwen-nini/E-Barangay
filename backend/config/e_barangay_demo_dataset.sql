-- E-Barangay Demo Dataset
-- For MySQL / XAMPP / phpMyAdmin
-- IMPORTANT:
-- 1. Create the e_barangay database and all 10 tables first.
-- 2. This dataset assumes all tables are EMPTY.
-- 3. Run this file only once unless you clear the tables first.
-- 4. Password hashes and uploaded file paths are placeholders for database testing.

USE e_barangay;

-- 1. USER
INSERT INTO `User`
(user_id, email, password_hash, role, account_status,
 notify_request_updates, notify_pickup_reminders, notify_announcements)
VALUES
(1, 'juan@gmail.com', 'demo_hash_1', 'Resident', 'Active', TRUE, TRUE, TRUE),
(2, 'maria@gmail.com', 'demo_hash_2', 'Resident', 'Active', TRUE, TRUE, TRUE),
(3, 'pedro@gmail.com', 'demo_hash_3', 'Resident', 'Active', TRUE, FALSE, TRUE),
(4, 'staff1@balagtas.gov.ph', 'demo_hash_4', 'Staff', 'Active', TRUE, TRUE, TRUE),
(5, 'staff2@balagtas.gov.ph', 'demo_hash_5', 'Staff', 'Active', TRUE, TRUE, TRUE);

-- 2. RESIDENT
INSERT INTO Resident
(resident_id, user_id, first_name, middle_name, last_name,
 name_extension, birth_date, complete_address, contact_number)
VALUES
(1, 1, 'Juan', 'Santos', 'Dela Cruz', NULL,
 '2002-05-15', 'Barangay Balagtas, Batangas City', '09123456789'),
(2, 2, 'Maria', 'Reyes', 'Santos', NULL,
 '2001-08-20', 'Barangay Balagtas, Batangas City', '09987654321'),
(3, 3, 'Pedro', 'Garcia', 'Mendoza', NULL,
 '1999-03-10', 'Barangay Balagtas, Batangas City', '09112223344');

-- 3. STAFF
INSERT INTO Staff
(staff_id, user_id, first_name, middle_name, last_name,
 name_extension, position)
VALUES
(1, 4, 'Antonio', 'Reyes', 'Cruz', NULL, 'Barangay Secretary'),
(2, 5, 'Ana', 'Santos', 'Garcia', NULL, 'Administrative Staff');

-- 4. DOCUMENT
INSERT INTO Document
(document_id, document_name, description, fee_per_copy,
 estimated_processing_days, availability)
VALUES
(1, 'Barangay Clearance',
 'Certification of good standing in the barangay.',
 50.00, 'Available'),
(2, 'Certificate of Residency',
 'Proof of residency within the barangay.',
 30.00, 'Available'),
(3, 'Certificate of Indigency',
 'Certification of indigency.',
 0.00, 'Available'),
(4, 'Certificate of Good Moral Character',
 'Certification of good moral character.',
 50.00, 'Unavailable');

-- 5. REQUIREMENT
INSERT INTO Requirement
(requirement_id, document_id, requirement_name, description, is_mandatory)
VALUES
(1, 1, 'Valid ID', 'Submit a valid government-issued ID.', TRUE),
(2, 1, 'Recent 1x1 Picture', 'Submit one recent 1x1 picture.', FALSE),
(3, 2, 'Valid ID', 'Submit a valid government-issued ID.', TRUE),
(4, 2, 'Proof of Residency', 'Submit proof of current address.', TRUE),
(5, 3, 'Valid ID', 'Submit a valid government-issued ID.', TRUE),
(6, 4, 'School ID', 'Submit a valid school ID.', TRUE);

-- 6. REQUEST
-- Includes examples of Pending, Under Review, Approved, Returned, and Released.
-- Requests 5 and 6 demonstrate the difference made by collection_confirmed.
INSERT INTO Request
(request_id, resident_id, document_id, assigned_staff_id,
 number_of_copies, purpose, request_date, status,
 approval_date, release_date,
 valid_id_presented, identity_matched,
 document_and_copies_verified, collection_confirmed)
VALUES
(1, 1, 1, NULL, 1, 'Employment requirement',
 NOW(), 'Pending', NULL, NULL, FALSE, FALSE, FALSE, FALSE),
(2, 2, 2, 1, 2, 'School requirement',
 NOW(), 'Under Review', NULL, NULL, TRUE, TRUE, FALSE, FALSE),
(3, 3, 3, 1, 1, 'Financial assistance application',
 NOW(), 'Approved', NOW(), NULL, TRUE, TRUE, TRUE, FALSE),
(4, 1, 2, 2, 1, 'Personal documentation',
 NOW(), 'Returned', NULL, NULL, TRUE, FALSE, FALSE, FALSE),
(5, 2, 1, 1, 2, 'Job application',
 NOW(), 'Released', NOW(), NOW(), TRUE, TRUE, TRUE, FALSE),
(6, 3, 1, 2, 1, 'Employment requirement',
 NOW(), 'Released', NOW(), NOW(), TRUE, TRUE, TRUE, TRUE);

-- 7. REQUEST_STATUS_HISTORY
INSERT INTO Request_Status_History
(history_id, request_id, changed_by_user_id, status, remarks)
VALUES
(1, 1, 1, 'Pending', 'Request submitted.'),
(2, 2, 2, 'Pending', 'Request submitted.'),
(3, 2, 4, 'Under Review', 'Staff is reviewing the request.'),
(4, 3, 3, 'Pending', 'Request submitted.'),
(5, 3, 4, 'Under Review', 'Requirements verified.'),
(6, 3, 4, 'Approved', 'Request approved.'),
(7, 4, 1, 'Pending', 'Request submitted.'),
(8, 4, 5, 'Returned', 'Please upload a clearer valid ID.'),
(9, 5, 2, 'Pending', 'Request submitted.'),
(10, 5, 4, 'Under Review', 'Request verified.'),
(11, 5, 4, 'Approved', 'Request approved.'),
(12, 5, 4, 'Released', 'Document released.'),
(13, 6, 3, 'Pending', 'Request submitted.'),
(14, 6, 5, 'Under Review', 'Request verified.'),
(15, 6, 5, 'Approved', 'Request approved.'),
(16, 6, 5, 'Released', 'Document released and collected.');

-- 8. UPLOADED_REQUIREMENTS
-- These rows store metadata only. The example files are not created by this SQL script.
INSERT INTO Uploaded_Requirements
(uploaded_requirement_id, request_id, requirement_id,
 original_filename, stored_filename, storage_path, mime_type, file_size)
VALUES
(1, 2, 3, 'maria_valid_id.jpg', 'upload_001.jpg',
 'uploads/requirements/upload_001.jpg', 'image/jpeg', 250000),
(2, 4, 3, 'juan_old_id.jpg', 'upload_002.jpg',
 'uploads/requirements/upload_002.jpg', 'image/jpeg', 180000),
(3, 5, 1, 'maria_clear_id.jpg', 'upload_003.jpg',
 'uploads/requirements/upload_003.jpg', 'image/jpeg', 320000),
(4, 6, 1, 'pedro_valid_id.jpg', 'upload_004.jpg',
 'uploads/requirements/upload_004.jpg', 'image/jpeg', 290000);

-- 9. ANNOUNCEMENT
INSERT INTO Announcement
(announcement_id, staff_id, title, content,
 published_at, expires_at, status)
VALUES
(1, 1, 'Barangay Hall Advisory',
 'The barangay hall will be closed on Monday.',
 NOW(), NULL, 'Published'),
(2, 2, 'Upcoming Community Meeting',
 'A community meeting will be held next week.',
 NULL, NULL, 'Draft'),
(3, 1, 'Community Clean-Up Drive',
 'Residents are invited to join the community clean-up drive.',
 NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 'Published');

-- 10. NOTIFICATION
INSERT INTO Notification
(notification_id, user_id, request_id, announcement_id,
 title, message, is_read)
VALUES
(1, 2, 2, NULL, 'Request Under Review',
 'Your Certificate of Residency request is being reviewed.', FALSE),
(2, 1, 4, NULL, 'Request Returned',
 'Please upload a clearer valid ID.', FALSE),
(3, 2, 5, NULL, 'Document Released',
 'Your Barangay Clearance is ready for collection.', FALSE),
(4, 3, 6, NULL, 'Document Released',
 'Your Barangay Clearance has been released.', TRUE),
(5, 1, NULL, 1, 'New Announcement',
 'Barangay Hall Advisory has been published.', FALSE),
(6, 3, NULL, 3, 'New Announcement',
 'Community Clean-Up Drive has been published.', FALSE);

-- VERIFICATION: Expected row counts are User 5, Resident 3, Staff 2,
-- Document 4, Requirement 6, Request 6, Request_Status_History 16,
-- Uploaded_Requirements 4, Announcement 3, Notification 6.
SELECT 'User' AS table_name, COUNT(*) AS total FROM `User`
UNION ALL SELECT 'Resident', COUNT(*) FROM Resident
UNION ALL SELECT 'Staff', COUNT(*) FROM Staff
UNION ALL SELECT 'Document', COUNT(*) FROM Document
UNION ALL SELECT 'Requirement', COUNT(*) FROM Requirement
UNION ALL SELECT 'Request', COUNT(*) FROM Request
UNION ALL SELECT 'Request_Status_History', COUNT(*) FROM Request_Status_History
UNION ALL SELECT 'Uploaded_Requirements', COUNT(*) FROM Uploaded_Requirements
UNION ALL SELECT 'Announcement', COUNT(*) FROM Announcement
UNION ALL SELECT 'Notification', COUNT(*) FROM Notification;
