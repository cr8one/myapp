-- AlterTable
ALTER TABLE "dlms_format_masters" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "dlms_note_masters" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "dlms_part_masters" ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;
