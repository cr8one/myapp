-- AlterTable
ALTER TABLE "t_device_software" ADD COLUMN     "user_id" TEXT;

-- AlterTable
ALTER TABLE "t_devices" ADD COLUMN     "parent_device_id" INTEGER;
