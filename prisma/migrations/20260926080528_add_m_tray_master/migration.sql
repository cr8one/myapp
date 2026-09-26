-- CreateTable
CREATE TABLE "m_trays" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "maker" TEXT NOT NULL,
    "rendo_tray_cd" TEXT,
    "purchase_evaluation" TEXT NOT NULL DEFAULT '通常',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_trays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_tray_images" (
    "id" TEXT NOT NULL,
    "tray_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_tray_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "m_tray_images" ADD CONSTRAINT "m_tray_images_tray_id_fkey" FOREIGN KEY ("tray_id") REFERENCES "m_trays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
