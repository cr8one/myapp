-- CreateTable
CREATE TABLE "dev_target_year_masters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_target_year_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_company_target_years" (
    "id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "target_year_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_company_target_years_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dev_target_year_masters_name_key" ON "dev_target_year_masters"("name");

-- CreateIndex
CREATE UNIQUE INDEX "dev_company_target_years_company_id_target_year_id_key" ON "dev_company_target_years"("company_id", "target_year_id");

-- AddForeignKey
ALTER TABLE "dev_company_target_years" ADD CONSTRAINT "dev_company_target_years_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "dev_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_company_target_years" ADD CONSTRAINT "dev_company_target_years_target_year_id_fkey" FOREIGN KEY ("target_year_id") REFERENCES "dev_target_year_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 初期データ（対象年度マスタ）
INSERT INTO "dev_target_year_masters" ("id", "name", "updated_at") VALUES
  ('target_year_2023', '2023年度', CURRENT_TIMESTAMP),
  ('target_year_2024', '2024年度', CURRENT_TIMESTAMP),
  ('target_year_2025', '2025年度', CURRENT_TIMESTAMP),
  ('target_year_2026', '2026年度', CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
