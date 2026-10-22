CREATE TABLE `account` (
	`id` text PRIMARY KEY,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_account_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `completion` (
	`id` text PRIMARY KEY,
	`task_id` text NOT NULL,
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`xp_awarded` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_completion_task_id_task_id_fk` FOREIGN KEY (`task_id`) REFERENCES `task`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_completion_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `goal` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`why` text,
	`target_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`completed_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_goal_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `journal_entry` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`mood` integer,
	`body` text DEFAULT '' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `journal_entry_pk` PRIMARY KEY(`user_id`, `day`),
	CONSTRAINT `fk_journal_entry_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `metric` (
	`goal_id` text PRIMARY KEY,
	`unit` text NOT NULL,
	`start_value` real NOT NULL,
	`target_value` real NOT NULL,
	`current_value` real NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_metric_goal_id_goal_id_fk` FOREIGN KEY (`goal_id`) REFERENCES `goal`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `metric_log` (
	`id` text PRIMARY KEY,
	`goal_id` text NOT NULL,
	`value` real NOT NULL,
	`logged_on` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_metric_log_goal_id_metric_goal_id_fk` FOREIGN KEY (`goal_id`) REFERENCES `metric`(`goal_id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `milestone` (
	`id` text PRIMARY KEY,
	`goal_id` text NOT NULL,
	`title` text NOT NULL,
	`position` integer NOT NULL,
	`done_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_milestone_goal_id_goal_id_fk` FOREIGN KEY (`goal_id`) REFERENCES `goal`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `reflection` (
	`user_id` text NOT NULL,
	`week_start` text NOT NULL,
	`answers` text NOT NULL,
	`goal_ratings` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `reflection_pk` PRIMARY KEY(`user_id`, `week_start`),
	CONSTRAINT `fk_reflection_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `rest_day` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `rest_day_pk` PRIMARY KEY(`user_id`, `day`),
	CONSTRAINT `fk_rest_day_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL UNIQUE,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_session_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `task` (
	`id` text PRIMARY KEY,
	`goal_id` text NOT NULL,
	`title` text NOT NULL,
	`effort` text NOT NULL,
	`cadence_type` text NOT NULL,
	`cadence_count` integer DEFAULT 1 NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_task_goal_id_goal_id_fk` FOREIGN KEY (`goal_id`) REFERENCES `goal`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`email` text NOT NULL UNIQUE,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`username` text UNIQUE,
	`display_username` text,
	`timezone` text DEFAULT 'UTC' NOT NULL,
	`reminder_time` text DEFAULT '20:00' NOT NULL,
	`day_start_hour` integer DEFAULT 3 NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `xp_event` (
	`id` text PRIMARY KEY,
	`user_id` text NOT NULL,
	`source` text NOT NULL,
	`source_id` text NOT NULL,
	`amount` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT `fk_xp_event_user_id_user_id_fk` FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `account_user_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `completion_task_day_uq` ON `completion` (`task_id`,`day`);--> statement-breakpoint
CREATE INDEX `completion_user_day_idx` ON `completion` (`user_id`,`day`);--> statement-breakpoint
CREATE INDEX `goal_user_status_idx` ON `goal` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `metric_log_goal_idx` ON `metric_log` (`goal_id`,`logged_on`);--> statement-breakpoint
CREATE INDEX `milestone_goal_idx` ON `milestone` (`goal_id`,`position`);--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE INDEX `task_goal_idx` ON `task` (`goal_id`);--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE INDEX `xp_event_user_idx` ON `xp_event` (`user_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `xp_event_source_uq` ON `xp_event` (`source`,`source_id`);