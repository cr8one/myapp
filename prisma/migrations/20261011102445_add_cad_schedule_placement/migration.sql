-- CreateTable
CREATE TABLE "t_cad_schedule_placements" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "start_abs" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_cad_schedule_placements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_cad_schedule_placements_request_id_key" ON "t_cad_schedule_placements"("request_id");

-- AddForeignKey
ALTER TABLE "t_cad_schedule_placements" ADD CONSTRAINT "t_cad_schedule_placements_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_cad_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
