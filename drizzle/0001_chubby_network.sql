CREATE TABLE `agents` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`name` text NOT NULL,
	`status` enum('active','inactive','paused') NOT NULL DEFAULT 'inactive',
	`external_id` varchar(255) NOT NULL,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` varchar(64) NOT NULL,
	`external_call_id` varchar(255) NOT NULL,
	`caller_number` varchar(20),
	`duration` int,
	`status` enum('completed','failed','missed','ongoing') NOT NULL,
	`transcription` text,
	`recording_url` text,
	`started_at` timestamp,
	`ended_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`type` enum('call_missed','agent_error','agent_offline','call_completed','system_alert') NOT NULL,
	`title` text NOT NULL,
	`message` text,
	`related_agent_id` varchar(64),
	`related_call_id` varchar(64),
	`is_notified` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_base_sources` (
	`id` varchar(64) NOT NULL,
	`knowledge_base_id` varchar(64) NOT NULL,
	`external_source_id` varchar(255) NOT NULL,
	`file_name` text,
	`file_url` text,
	`type` enum('file','url','text') NOT NULL,
	`status` enum('ingesting','ready','failed') NOT NULL DEFAULT 'ingesting',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_base_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `knowledge_bases` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` varchar(64),
	`external_knowledge_base_id` varchar(255) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`source_count` int DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_bases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phone_numbers` (
	`id` varchar(64) NOT NULL,
	`user_id` int NOT NULL,
	`agent_id` varchar(64),
	`external_phone_number_id` varchar(255) NOT NULL,
	`number` varchar(20) NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `phone_numbers_id` PRIMARY KEY(`id`)
);
