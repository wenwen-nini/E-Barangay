-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 25, 2026 at 12:21 PM
-- Server version: 10.11.19-MariaDB
-- PHP Version: 8.5.13

SET FOREIGN_KEY_CHECKS=0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `e_barangay`
--

--
-- Dumping data for table `announcement`
--

INSERT INTO `Announcement` (`announcement_id`, `staff_id`, `title`, `content`, `created_at`, `published_at`, `expires_at`, `status`) VALUES
(2, 1, 'Test Barangay Announcement (2)', 'Test announcement lorem ipsum skibidi 67', '2026-11-24 22:44:37', NULL, NULL, 'Draft'),
(3, 1, 'Test Barangay Announcement (3)', 'test Barangay Announcement with expiration date skibidi toilet 67', '2026-11-24 22:49:04', '2026-11-24 22:51:40', NULL, 'Published');

--
-- Dumping data for table `document`
--

INSERT INTO `Document` (`document_id`, `document_name`, `description`, `fee_per_copy`, `availability`, `document_preview_path`) VALUES
(1, 'Barangay Clearance', 'A barangay clearance typically requires a valid ID, proof of residency, a filled-out application form, and payment of a local fee (usually ₱20–₱100 for personal use, or free for qualified first-time job seekers).', 20.00, 'Available', '/uploads/document-previews/1795354216689-840451688.jpg'),
(3, 'Certificate of Indigency', 'Proves low income or financial need for medical/financial aid (DSWD, PCSO), scholarships, or free legal assistance', 0.00, 'Available', '/uploads/document-previews/1795354285530-997301268.jpg'),
(4, 'Certificate of Good Moral Character', 'Certification of good moral character.', 0.00, 'Unavailable', '/uploads/document-previews/1795354256124-300240047.jpg'),
(16, 'Certificate of Burial Assistance', 'A Certificate for Burial', 50.00, 'Available', '/uploads/document-previews/1795352450951-795230878.jpg'),
(17, 'Barangay Certification', 'Certificate for Barangay', 0.00, 'Available', '/uploads/document-previews/1795354189633-580789417.jpg');

--
-- Dumping data for table `notification`
--

INSERT INTO `Notification` (`notification_id`, `user_id`, `request_id`, `announcement_id`, `title`, `message`, `is_read`, `created_at`) VALUES
(1, 1, 10, NULL, 'Request Under Review', 'Your document request is now under review.', 1, '2026-11-24 22:22:44'),
(2, 1, 10, NULL, 'Request Approved', 'Your document request has been approved.', 1, '2026-11-24 22:30:07'),
(3, 1, 10, NULL, 'Request Returned', 'Your document request requires corrections. Staff remarks: Comply with your requirements based on the remarks', 1, '2026-11-24 22:34:51'),
(4, 1, 10, NULL, 'Request Rejected', 'Your document request has been rejected. Staff remarks: Your requirements are ineligible to request the particular document.', 1, '2026-11-24 22:36:57'),
(5, 1, NULL, 3, 'Test Barangay Announcement (3)', 'test Barangay Announcement with expiration date skibidi toilet 67', 1, '2026-11-24 23:03:05'),
(6, 1, 10, NULL, 'Request Approved', 'Your document request has been approved.', 1, '2026-11-24 23:08:10'),
(7, 1, 10, NULL, 'Document Released', 'Your requested document has been released.', 1, '2026-11-24 23:11:26'),
(8, 1, NULL, NULL, 'draft', 'for deleting', 1, '2026-11-25 00:22:13'),
(9, 1, NULL, 3, 'Test Barangay Announcement (3)', 'test Barangay Announcement with expiration date skibidi toilet 67', 1, '2026-11-25 00:56:41');

--
-- Dumping data for table `request`
--

INSERT INTO `Request` (`request_id`, `resident_id`, `document_id`, `assigned_staff_id`, `number_of_copies`, `purpose`, `request_date`, `status`, `approval_date`, `release_date`, `valid_id_presented`, `identity_matched`, `document_and_copies_verified`, `collection_confirmed`) VALUES
(2, 1, 1, NULL, 2, 'For employment requirements', '2026-11-23 23:05:25', 'Returned', NULL, NULL, 0, 0, 0, 0),
(3, 1, 1, NULL, 1, 'For employment requirements', '2026-11-24 00:04:01', 'Rejected', NULL, NULL, 0, 0, 0, 0),
(4, 1, 1, NULL, 2, 'Barangay Clearance', '2026-11-24 01:24:45', 'Cancelled', NULL, NULL, 0, 0, 0, 0),
(5, 1, 16, 1, 3, 'I am going to bury myself', '2026-11-24 14:52:56', 'Approved', '2026-11-24 17:07:34', NULL, 0, 0, 0, 0),
(6, 1, 16, 1, 2, 'I am going to bury myself 2', '2026-11-24 17:52:08', 'Released', '2026-11-24 18:18:16', '2026-11-24 21:27:49', 1, 1, 1, 1),
(7, 1, 16, 1, 4, 'I am going to bury myself 3', '2026-11-24 18:18:50', 'Rejected', NULL, NULL, 0, 0, 0, 0),
(8, 1, 3, 1, 2, 'mahirap po ako', '2026-11-24 18:19:07', 'Returned', NULL, NULL, 0, 0, 0, 0),
(9, 1, 3, 1, 2, 'asdqseqw', '2026-11-24 18:39:35', 'Released', '2026-11-24 20:00:02', '2026-11-24 20:39:28', 1, 1, 1, 1),
(10, 1, 17, 1, 1, 'test', '2026-11-24 22:20:27', 'Released', '2026-11-24 23:08:10', '2026-11-24 23:11:25', 1, 1, 1, 1),
(11, 1, 17, NULL, 1, 'test', '2026-11-25 00:57:53', 'Pending', NULL, NULL, 0, 0, 0, 0);

--
-- Dumping data for table `request_status_history`
--

INSERT INTO `Request_Status_History` (`history_id`, `request_id`, `changed_by_user_id`, `status`, `remarks`, `changed_at`) VALUES
(1, 2, 1, 'Pending', 'Request submitted successfully.', '2026-11-23 23:05:25'),
(2, 3, 1, 'Pending', 'Request submitted successfully.', '2026-11-24 00:04:01'),
(3, 4, 1, 'Pending', 'Request submitted successfully.', '2026-11-24 01:24:45'),
(4, 3, 1, 'Pending', 'Resident submitted corrected requirements.', '2026-11-24 01:42:25'),
(5, 3, 1, 'Pending', 'Resident follow-up: May I ask for an update on my document request?', '2026-11-24 13:39:29'),
(6, 4, 1, 'Pending', 'Resident follow-up: asdas', '2026-11-24 13:52:24'),
(7, 4, 1, 'Cancelled', 'Resident cancelled request.', '2026-11-24 13:56:09'),
(8, 5, 1, 'Pending', 'Request submitted successfully.', '2026-11-24 14:52:56'),
(9, 5, 2, 'Under Review', 'Staff started reviewing the request.', '2026-11-24 17:06:32'),
(10, 5, 2, 'Approved', 'Requirements reviewed and approved.', '2026-11-24 17:07:34'),
(11, 3, 2, 'Rejected', 'The submitted requirements do not meet the necessary conditions.', '2026-11-24 17:11:45'),
(12, 2, 2, 'Returned', 'Please upload a clearer copy of your Birth Certificate.', '2026-11-24 17:14:45'),
(13, 6, 1, 'Pending', 'Request submitted successfully.', '2026-11-24 17:52:08'),
(14, 6, 2, 'Under Review', 'Staff is currently reviewing your request', '2026-11-24 18:17:58'),
(15, 6, 2, 'Approved', 'Your request is now approved.', '2026-11-24 18:18:16'),
(16, 7, 1, 'Pending', 'Request submitted successfully.', '2026-11-24 18:18:50'),
(17, 8, 1, 'Pending', 'Request submitted successfully.', '2026-11-24 18:19:07'),
(18, 7, 2, 'Under Review', 'Staff is currently reviewing your request.', '2026-11-24 18:20:01'),
(19, 7, 2, 'Rejected', 'I reject your request', '2026-11-24 18:20:10'),
(20, 8, 2, 'Under Review', 'Staff is currently reviewing your request.', '2026-11-24 18:20:29'),
(21, 8, 2, 'Returned', 'Please upload a clearer image of your valid ID', '2026-11-24 18:20:48'),
(22, 9, 1, 'Pending', 'Request submitted successfully.', '2026-11-24 18:39:35'),
(23, 9, 2, 'Under Review', 'asdad', '2026-11-24 18:39:49'),
(24, 9, 2, 'Returned', 'Your request is returned. Please accomplish what is the barangay instructed you to do in order for you to claim the document.', '2026-11-24 19:33:32'),
(25, 9, 1, 'Pending', 'Resident submitted corrected requirements.', '2026-11-24 19:40:15'),
(26, 9, 2, 'Under Review', 'Staff is currently Reviewing your request', '2026-11-24 19:41:14'),
(27, 9, 2, 'Approved', 'Approved', '2026-11-24 20:00:02'),
(28, 9, 2, 'Released', 'Document successfully released to resident.', '2026-11-24 20:39:28'),
(29, 6, 2, 'Released', 'Document successfully released to resident.', '2026-11-24 21:27:49'),
(30, 10, 1, 'Pending', 'Request submitted successfully.', '2026-11-24 22:20:27'),
(31, 10, 2, 'Under Review', 'Staff is currently reviewing your request.', '2026-11-24 22:22:44'),
(32, 10, 2, 'Approved', 'Your request is approved.', '2026-11-24 22:25:05'),
(33, 10, 2, 'Approved', 'Your request has been approved. Please proceed to the barangay hall for releasing.', '2026-11-24 22:29:18'),
(34, 10, 2, 'Approved', 'Your request has been approved. Please proceed to the barangay hall for releasing.', '2026-11-24 22:30:07'),
(35, 10, 2, 'Returned', 'Comply with your requirements based on the remarks', '2026-11-24 22:34:51'),
(36, 10, 2, 'Rejected', 'Your requirements are ineligible to request the particular document.', '2026-11-24 22:36:57'),
(37, 10, 2, 'Approved', 'Your request has been approved. Please proceed to the barangay hall for releasing.', '2026-11-24 23:08:10'),
(38, 10, 2, 'Released', 'Document successfully released to resident.', '2026-11-24 23:11:25'),
(39, 11, 1, 'Pending', 'Request submitted successfully.', '2026-11-25 00:57:53');

--
-- Dumping data for table `requirement`
--

INSERT INTO `Requirement` (`requirement_id`, `document_id`, `requirement_name`, `description`, `is_mandatory`) VALUES
(1, 1, 'Valid ID', 'Submit a valid government-issued ID.', 1),
(2, 1, 'Recent 1x1 Picture', 'Submit one recent 1x1 picture.', 1),
(5, 3, 'Valid ID', 'Submit a valid government-issued ID.', 1),
(6, 4, 'School ID', 'Submit a valid school ID.', 1),
(22, 16, 'Birth Certificate', 'A Copy of Birth Certificate', 1),
(23, 16, 'Valid ID', 'Any government Valid ID', 1),
(27, 1, 'Proof of Residency', 'Submit any one proof of residency (utility bill, lease contract, etc.)', 1),
(28, 3, 'Proof of residency', 'Utility bill, lease contract, or HOA certificate if your ID does not show your current address.', 1),
(29, 17, 'Community Tax Certificate (Cedula)', NULL, 1),
(30, 17, 'Valid ID', 'Submit one government valid ID', 1);

--
-- Dumping data for table `resident`
--

INSERT INTO `Resident` (`resident_id`, `user_id`, `first_name`, `middle_name`, `last_name`, `name_extension`, `birth_date`, `complete_address`, `contact_number`) VALUES
(1, 1, 'Alwynn', 'Lauzon', 'Aguho', NULL, '2005-09-20', 'Barangay Alangilan, Batangas City', '09850316553');

--
-- Dumping data for table `staff`
--

INSERT INTO `Staff` (`staff_id`, `user_id`, `first_name`, `middle_name`, `last_name`, `name_extension`, `position`) VALUES
(1, 2, 'John Red', 'Sevilla', 'Jamilano', NULL, 'Barangay Staff');

--
-- Dumping data for table `uploaded_requirements`
--

INSERT INTO `Uploaded_Requirements` (`uploaded_requirement_id`, `request_id`, `requirement_id`, `original_filename`, `stored_filename`, `storage_path`, `mime_type`, `file_size`, `uploaded_at`, `verification_status`, `staff_remarks`, `verified_by_staff_id`, `verified_at`) VALUES
(1, 3, 1, 'residency.png', '1795449841469-498529966.png', 'uploads/request-requirements/1795449841469-498529966.png', 'image/png', 23521, '2026-11-24 00:04:01', 'Pending', NULL, NULL, NULL),
(2, 3, 2, 'recent 1x1 pic.jpg', '1795449841482-232063124.jpg', 'uploads/request-requirements/1795449841482-232063124.jpg', 'image/jpeg', 7682, '2026-11-24 00:04:01', 'Pending', NULL, NULL, NULL),
(3, 3, 27, 'valid id.jpg', '1795455745562-307780330.jpg', 'uploads/request-requirements/1795455745562-307780330.jpg', 'image/jpeg', 54447, '2026-11-24 01:42:25', 'Pending', NULL, NULL, NULL),
(4, 4, 1, 'valid id.jpg', '1795454685598-442560157.jpg', 'uploads/request-requirements/1795454685598-442560157.jpg', 'image/jpeg', 54447, '2026-11-24 01:24:45', 'Pending', NULL, NULL, NULL),
(5, 4, 2, 'recent 1x1 pic.jpg', '1795454685626-145711957.jpg', 'uploads/request-requirements/1795454685626-145711957.jpg', 'image/jpeg', 7682, '2026-11-24 01:24:45', 'Pending', NULL, NULL, NULL),
(6, 4, 27, 'residency.png', '1795454685627-431271938.png', 'uploads/request-requirements/1795454685627-431271938.png', 'image/png', 23521, '2026-11-24 01:24:45', 'Pending', NULL, NULL, NULL),
(7, 5, 22, 'birth certificate.jpg', '1795503176794-832999629.jpg', 'uploads/request-requirements/1795503176794-832999629.jpg', 'image/jpeg', 211239, '2026-11-24 14:52:56', 'Pending', NULL, NULL, NULL),
(8, 5, 23, 'valid id.jpg', '1795503176808-976195387.jpg', 'uploads/request-requirements/1795503176808-976195387.jpg', 'image/jpeg', 54447, '2026-11-24 14:52:56', 'Pending', NULL, NULL, NULL),
(9, 6, 22, 'birth certificate.jpg', '1795513928909-714728866.jpg', 'uploads/request-requirements/1795513928909-714728866.jpg', 'image/jpeg', 211239, '2026-11-24 17:52:08', 'Accepted', NULL, 1, '2026-11-24 18:56:09'),
(10, 6, 23, 'valid id.jpg', '1795513928929-709245025.jpg', 'uploads/request-requirements/1795513928929-709245025.jpg', 'image/jpeg', 54447, '2026-11-24 17:52:08', 'Accepted', NULL, 1, '2026-11-24 18:56:11'),
(11, 7, 22, 'birth certificate.jpg', '1795515529965-989105594.jpg', 'uploads/request-requirements/1795515529965-989105594.jpg', 'image/jpeg', 211239, '2026-11-24 18:18:50', 'Pending', NULL, NULL, NULL),
(12, 7, 23, 'valid id.jpg', '1795515529993-978721174.jpg', 'uploads/request-requirements/1795515529993-978721174.jpg', 'image/jpeg', 54447, '2026-11-24 18:18:50', 'Pending', NULL, NULL, NULL),
(13, 8, 5, 'valid id.jpg', '1795515547536-47243124.jpg', 'uploads/request-requirements/1795515547536-47243124.jpg', 'image/jpeg', 54447, '2026-11-24 18:19:07', 'Accepted', NULL, 1, '2026-11-24 19:32:04'),
(14, 8, 28, 'residency.png', '1795515547542-257375207.png', 'uploads/request-requirements/1795515547542-257375207.png', 'image/png', 23521, '2026-11-24 18:19:07', 'Needs Correction', 'Please upload a clearer image of Proof of residency.', 1, '2026-11-24 19:32:17'),
(15, 9, 5, 'valid id.jpg', '1795516775068-82455946.jpg', 'uploads/request-requirements/1795516775068-82455946.jpg', 'image/jpeg', 54447, '2026-11-24 18:39:35', 'Accepted', NULL, 1, '2026-11-24 18:55:10'),
(16, 9, 28, 'residency.png', '1795520415456-274919006.png', 'uploads/request-requirements/1795520415456-274919006.png', 'image/png', 23521, '2026-11-24 19:40:15', 'Accepted', NULL, 1, '2026-11-24 19:41:01'),
(17, 10, 29, 'cedula.jpg', '1795530027356-713925856.jpg', 'uploads/request-requirements/1795530027356-713925856.jpg', 'image/jpeg', 37335, '2026-11-24 22:20:27', 'Accepted', 'Please upload clearer image of your Community Tax Certificate.', 1, '2026-11-24 23:07:50'),
(18, 10, 30, 'valid id.jpg', '1795530027359-142179515.jpg', 'uploads/request-requirements/1795530027359-142179515.jpg', 'image/jpeg', 54447, '2026-11-24 22:20:27', 'Accepted', NULL, 1, '2026-11-24 22:24:58'),
(19, 11, 29, 'cedula.jpg', '1795539473131-828636724.jpg', 'uploads/request-requirements/1795539473131-828636724.jpg', 'image/jpeg', 37335, '2026-11-25 00:57:53', 'Pending', NULL, NULL, NULL),
(20, 11, 30, 'valid id.jpg', '1795539473159-188245858.jpg', 'uploads/request-requirements/1795539473159-188245858.jpg', 'image/jpeg', 54447, '2026-11-25 00:57:53', 'Pending', NULL, NULL, NULL);

--
-- Dumping data for table `user`
--

INSERT INTO `User` (`user_id`, `email`, `password_hash`, `role`, `account_status`, `created_at`, `notify_request_updates`, `notify_pickup_reminders`, `notify_announcements`, `profile_image_path`) VALUES
(1, 'aaguho20@gmail.com', '$2b$12$ySi5hG1jIk5fKuHyNyWzR.wNP6AJB5Ox/wEXjQ5TgJn3RgbyAbO0G', 'Resident', 'Active', '2026-11-21 20:07:25', 1, 1, 0, '/uploads/profile-images/profile-1-1795543104254.jpg'),
(2, 'staff@balagtas.gov.ph', '$2b$12$xn/e4skjptT3H/z5sY60s.0/5sogyMzKWMi4jzo4q8sS/raqW4SxC', 'Staff', 'Active', '2026-11-21 20:11:16', 1, 1, 1, '/uploads/profile-images/profile-2-1795543540509.png');
SET FOREIGN_KEY_CHECKS=1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
