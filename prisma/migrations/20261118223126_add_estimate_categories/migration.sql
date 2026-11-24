-- AlterTable
ALTER TABLE "t_estimates" ADD COLUMN     "category_id" TEXT,
ADD COLUMN     "contact_name" TEXT,
ADD COLUMN     "due_date" DATE,
ADD COLUMN     "result" JSONB;

-- CreateTable
CREATE TABLE "m_est_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "next_serial" INTEGER NOT NULL DEFAULT 1,
    "default_standard_id" TEXT,
    "customer_name" TEXT,
    "remarks" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_est_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_est_categories_name_key" ON "m_est_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "m_est_categories_code_key" ON "m_est_categories"("code");

-- CreateIndex
CREATE INDEX "t_estimates_category_id_idx" ON "t_estimates"("category_id");

-- AddForeignKey
ALTER TABLE "t_estimates" ADD CONSTRAINT "t_estimates_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "m_est_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "m_est_categories" ADD CONSTRAINT "m_est_categories_default_standard_id_fkey" FOREIGN KEY ("default_standard_id") REFERENCES "m_est_standards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
