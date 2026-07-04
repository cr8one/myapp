-- AlterTable
ALTER TABLE "user_permissions" ADD COLUMN     "dpp_storage_ledger_import" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "t_dpp_storage_ledger_entry" (
    "id" TEXT NOT NULL,
    "storage_location" TEXT NOT NULL,
    "hinban" TEXT NOT NULL,
    "category" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_dpp_storage_ledger_entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_dpp_storage_ledger_entry_storage_location_idx" ON "t_dpp_storage_ledger_entry"("storage_location");

-- CreateIndex
CREATE INDEX "t_dpp_storage_ledger_entry_hinban_idx" ON "t_dpp_storage_ledger_entry"("hinban");
