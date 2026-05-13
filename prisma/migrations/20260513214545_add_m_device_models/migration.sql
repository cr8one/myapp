-- CreateTable
CREATE TABLE "m_device_models" (
    "model_id" SERIAL NOT NULL,
    "vendor_id" INTEGER,
    "device_type_id" INTEGER,
    "model_name" TEXT NOT NULL,
    "model_number" TEXT,
    "os_name" TEXT,
    "cpu_info" TEXT,
    "memory_default" TEXT,
    "storage_default" TEXT,
    "eol_date" TIMESTAMP(3),
    "image_path" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_device_models_pkey" PRIMARY KEY ("model_id")
);
