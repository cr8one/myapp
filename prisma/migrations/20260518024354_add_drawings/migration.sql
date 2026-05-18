-- CreateTable
CREATE TABLE "t_drawings" (
    "id" SERIAL NOT NULL,
    "drawing_no" TEXT,
    "title" TEXT,
    "product_no" TEXT,
    "paper_size" TEXT,
    "paper_type" TEXT,
    "blade_size" TEXT,
    "note" TEXT,
    "storage_location" TEXT,
    "created_date" TEXT,
    "approved_by" TEXT,
    "confirmed_by" TEXT,
    "assigned_by" TEXT,
    "legacy_file_path" TEXT,
    "legacy_file_type" TEXT,
    "new_file_path" TEXT,
    "new_file_type" TEXT,
    "dieline_id" TEXT,
    "flg_del" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_drawings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_drawings" ADD CONSTRAINT "t_drawings_dieline_id_fkey" FOREIGN KEY ("dieline_id") REFERENCES "dlms_dieline_parents"("id") ON DELETE SET NULL ON UPDATE CASCADE;
