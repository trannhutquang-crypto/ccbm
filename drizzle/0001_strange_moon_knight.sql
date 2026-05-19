CREATE TABLE `exportItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`exportRecordId` int NOT NULL,
	`medicineId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `exportItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exportRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicineId` int NOT NULL,
	`quantity` int NOT NULL,
	`exportedBy` varchar(255) NOT NULL,
	`reason` enum('emergency_use','expired','damaged','other') NOT NULL,
	`totalPrice` decimal(12,2),
	`exportDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exportRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `importRecords` (
	`id` int AUTO_INCREMENT NOT NULL,
	`medicineId` int NOT NULL,
	`quantity` int NOT NULL,
	`supplier` varchar(255) NOT NULL,
	`batchNumber` varchar(100),
	`expiryDate` date NOT NULL,
	`importDate` date NOT NULL,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `importRecords_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `medicines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`unit` varchar(50) NOT NULL,
	`minimumStock` int NOT NULL DEFAULT 0,
	`currentStock` int NOT NULL DEFAULT 0,
	`expiryDate` date,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `medicines_id` PRIMARY KEY(`id`)
);
