-- CreateTable
CREATE TABLE "m_cad_clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_cad_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "m_cad_papers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "width" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_cad_papers_pkey" PRIMARY KEY ("id")
);
