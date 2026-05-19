-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `openId` varchar(64) NOT NULL UNIQUE,
  `name` text,
  `email` varchar(320),
  `loginMethod` varchar(64),
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create medicines table
CREATE TABLE IF NOT EXISTS `medicines` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `unit` varchar(50) NOT NULL,
  `minimumStock` int NOT NULL DEFAULT 0,
  `currentStock` int NOT NULL DEFAULT 0,
  `expiryDate` date,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create importRecords table
CREATE TABLE IF NOT EXISTS `importRecords` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `medicineId` int NOT NULL,
  `quantity` int NOT NULL,
  `supplier` varchar(255) NOT NULL,
  `batchNumber` varchar(100),
  `expiryDate` date NOT NULL,
  `importDate` date NOT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create exportRecords table
CREATE TABLE IF NOT EXISTS `exportRecords` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `medicineId` int NOT NULL,
  `quantity` int NOT NULL,
  `exportedBy` varchar(255) NOT NULL,
  `reason` enum('emergency_use','expired','damaged','other') NOT NULL,
  `totalPrice` decimal(12,2),
  `exportDate` date NOT NULL,
  `notes` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create exportItems table
CREATE TABLE IF NOT EXISTS `exportItems` (
  `id` int AUTO_INCREMENT NOT NULL PRIMARY KEY,
  `exportRecordId` int NOT NULL,
  `medicineId` int NOT NULL,
  `quantity` int NOT NULL,
  `unitPrice` decimal(12,2),
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX `medicines_updatedAt_idx` ON `medicines` (`updatedAt`);
CREATE INDEX `medicines_currentStock_idx` ON `medicines` (`currentStock`);
CREATE INDEX `medicines_expiryDate_idx` ON `medicines` (`expiryDate`);
CREATE INDEX `importRecords_medicineId_idx` ON `importRecords` (`medicineId`);
CREATE INDEX `importRecords_importDate_idx` ON `importRecords` (`importDate`);
CREATE INDEX `exportRecords_medicineId_idx` ON `exportRecords` (`medicineId`);
CREATE INDEX `exportRecords_exportDate_idx` ON `exportRecords` (`exportDate`);
CREATE INDEX `exportItems_exportRecordId_idx` ON `exportItems` (`exportRecordId`);
CREATE INDEX `exportItems_medicineId_idx` ON `exportItems` (`medicineId`);
