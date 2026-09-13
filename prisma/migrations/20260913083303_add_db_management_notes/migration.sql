-- CreateTable
CREATE TABLE "t_db_management_notes" (
    "id" TEXT NOT NULL,
    "table_name" TEXT NOT NULL,
    "field_name" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_db_management_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_db_management_notes_table_name_field_name_key" ON "t_db_management_notes"("table_name", "field_name");
