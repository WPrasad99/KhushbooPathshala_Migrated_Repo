-- =====================================================================
-- Khushboo Pathshala — Migration 001: Production Schema Hardening
-- Applied to: khushboo_drupal database
-- Description: Adds foreign key constraints, composite indexes, and migration log table.
-- =====================================================================

SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- 1. Migration Log Table
CREATE TABLE IF NOT EXISTS `kp_migrations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `migration_name` VARCHAR(255) NOT NULL UNIQUE,
  `applied_at` INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Foreign Key Constraints (relational integrity across kp_* entities)

-- Batch students: delete student link when batch or user is deleted
ALTER TABLE `kp_batch_students`
  ADD CONSTRAINT `fk_kp_bs_batch` FOREIGN KEY (`batch_id`) REFERENCES `kp_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kp_bs_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Batch mentors: delete mentor assignment when batch or user is deleted
ALTER TABLE `kp_batch_mentors`
  ADD CONSTRAINT `fk_kp_bm_batch` FOREIGN KEY (`batch_id`) REFERENCES `kp_batches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kp_bm_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Session tracking: clean up tracking when resource or user is deleted
ALTER TABLE `kp_session_tracking`
  ADD CONSTRAINT `fk_kp_st_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kp_st_resource` FOREIGN KEY (`resource_id`) REFERENCES `kp_resources` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Mentorship: mentor & mentee relations
ALTER TABLE `kp_mentorship`
  ADD CONSTRAINT `fk_kp_m_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kp_m_mentee` FOREIGN KEY (`mentee_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Meetings: linked to mentor
ALTER TABLE `kp_meetings`
  ADD CONSTRAINT `fk_kp_meet_mentor` FOREIGN KEY (`mentor_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Assignments: created by mentor/admin
ALTER TABLE `kp_assignments`
  ADD CONSTRAINT `fk_kp_assign_creator` FOREIGN KEY (`created_by_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Assignment submissions: assignment and student
ALTER TABLE `kp_assignment_submissions`
  ADD CONSTRAINT `fk_kp_sub_assign` FOREIGN KEY (`assignment_id`) REFERENCES `kp_assignments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kp_sub_student` FOREIGN KEY (`student_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Resources: uploaded by
ALTER TABLE `kp_resources`
  ADD CONSTRAINT `fk_kp_res_uploader` FOREIGN KEY (`uploaded_by_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Forum posts & answers
ALTER TABLE `kp_forum_posts`
  ADD CONSTRAINT `fk_kp_fp_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kp_forum_answers`
  ADD CONSTRAINT `fk_kp_fa_post` FOREIGN KEY (`post_id`) REFERENCES `kp_forum_posts` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kp_fa_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Announcements
ALTER TABLE `kp_announcements`
  ADD CONSTRAINT `fk_kp_ann_author` FOREIGN KEY (`author_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Chat groups, members, messages
ALTER TABLE `kp_chat_groups`
  ADD CONSTRAINT `fk_kp_cg_creator` FOREIGN KEY (`created_by_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kp_chat_members`
  ADD CONSTRAINT `fk_kp_cm_group` FOREIGN KEY (`group_id`) REFERENCES `kp_chat_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kp_cm_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kp_chat_messages`
  ADD CONSTRAINT `fk_kp_cmsg_group` FOREIGN KEY (`group_id`) REFERENCES `kp_chat_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_kp_cmsg_sender` FOREIGN KEY (`sender_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Notifications, roadmaps, login logs
ALTER TABLE `kp_notifications`
  ADD CONSTRAINT `fk_kp_notif_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kp_roadmaps`
  ADD CONSTRAINT `fk_kp_rm_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `kp_login_logs`
  ADD CONSTRAINT `fk_kp_ll_user` FOREIGN KEY (`user_id`) REFERENCES `kp_users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Composite Indexes for High-Velocity Queries
ALTER TABLE `kp_notifications` ADD INDEX `idx_user_unread_created` (`user_id`, `is_read`, `created_at`);
ALTER TABLE `kp_forum_posts` ADD INDEX `idx_batch_created` (`batch_id`, `created_at`);
ALTER TABLE `kp_forum_answers` ADD INDEX `idx_post_upvotes` (`post_id`, `upvotes`);
ALTER TABLE `kp_assignments` ADD INDEX `idx_batch_created` (`batch_id`, `created_at`);
ALTER TABLE `kp_quiz_submissions` ADD INDEX `idx_quiz_student` (`quiz_id`, `student_id`);

-- 4. Update seed admin hash to valid bcrypt for password123
UPDATE `kp_users` 
SET `password_hash` = '$2y$12$wQXOrhhOaQd1dBSMCFyGf.9qg/Q8B7/UCx.plR8sSPm5bgkC0dvv6' 
WHERE `email` = 'admin@cybage.com';

-- 5. Record Migration Completion
INSERT INTO `kp_migrations` (`migration_name`, `applied_at`) 
VALUES ('001_production_hardening', UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE `applied_at` = UNIX_TIMESTAMP();

SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
