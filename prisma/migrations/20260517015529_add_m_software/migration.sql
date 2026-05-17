-- CreateTable
CREATE TABLE "m_software" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "vendor" TEXT,
    "license_type" TEXT,
    "license_count" INTEGER,
    "note" TEXT,
    "flg_del" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_software_pkey" PRIMARY KEY ("id")
);
