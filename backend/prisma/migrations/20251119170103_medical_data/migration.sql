/*
  Warnings:

  - Added the required column `userId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `CancerType` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Appointment` ADD COLUMN `userId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `CancerType` ADD COLUMN `userId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Appointment` ADD CONSTRAINT `Appointment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CancerType` ADD CONSTRAINT `CancerType_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
