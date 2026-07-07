-- CreateTable
CREATE TABLE "m_cad_options" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_cad_options_pkey" PRIMARY KEY ("id")
);
