-- CreateTable
CREATE TABLE "m_cad_standard_times" (
    "id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "min_kosei" INTEGER,
    "min_yugata" INTEGER,
    "min_shinki" INTEGER,
    "note" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_cad_standard_times_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_cad_work_times" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "standard_minutes" INTEGER,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_cad_work_times_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "m_cad_standard_times_option_id_key" ON "m_cad_standard_times"("option_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_cad_work_times_request_id_key" ON "t_cad_work_times"("request_id");

-- AddForeignKey
ALTER TABLE "m_cad_standard_times" ADD CONSTRAINT "m_cad_standard_times_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "m_cad_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_cad_work_times" ADD CONSTRAINT "t_cad_work_times_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_cad_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
