CREATE TABLE `sync_counter` (
	`id` text PRIMARY KEY NOT NULL,
	`value` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workout` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`seq` integer NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_user_seq_idx` ON `workout` (`user_id`,`seq`);--> statement-breakpoint
CREATE TABLE `workout_set` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	`seq` integer NOT NULL,
	`workout_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`reps` integer NOT NULL,
	`weight` real NOT NULL,
	`rir` integer,
	`type` text NOT NULL,
	`note` text,
	`performed_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `workout_set_user_seq_idx` ON `workout_set` (`user_id`,`seq`);