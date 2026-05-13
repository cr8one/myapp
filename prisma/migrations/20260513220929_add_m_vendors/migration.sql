-- CreateTable
CREATE TABLE "m_vendors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "flg_del" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_vendors_pkey" PRIMARY KEY ("id")
);
