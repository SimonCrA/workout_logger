CREATE TABLE `routine` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`seq` integer NOT NULL,
	`name` text NOT NULL,
	`base_routine_id` text,
	`exercises` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `routine_user_seq_idx` ON `routine` (`user_id`,`seq`);