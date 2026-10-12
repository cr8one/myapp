-- CreateTable
CREATE TABLE "m_cad_work_rules" (
    "id" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "valid_from" TEXT NOT NULL,
    "valid_to" TEXT,
    "start_min" INTEGER NOT NULL,
    "end_min" INTEGER NOT NULL,
    "break_start" INTEGER,
    "break_end" INTEGER,
    "working_days" TEXT NOT NULL DEFAULT '0111110',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_cad_work_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_cad_work_day_overrides" (
    "id" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "is_off" BOOLEAN NOT NULL DEFAULT false,
    "start_min" INTEGER,
    "end_min" INTEGER,
    "break_start" INTEGER,
    "break_end" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_cad_work_day_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "m_cad_work_rules_machine_valid_from_idx" ON "m_cad_work_rules"("machine", "valid_from");

-- CreateIndex
CREATE UNIQUE INDEX "t_cad_work_day_overrides_machine_date_key" ON "t_cad_work_day_overrides"("machine", "date");
