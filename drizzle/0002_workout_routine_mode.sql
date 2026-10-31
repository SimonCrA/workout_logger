ALTER TABLE `workout` ADD `routine_id` text;--> statement-breakpoint
ALTER TABLE `workout` ADD `title` text;--> statement-breakpoint
ALTER TABLE `workout` ADD `mode` text DEFAULT 'companion' NOT NULL;