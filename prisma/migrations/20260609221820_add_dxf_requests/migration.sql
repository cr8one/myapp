-- CreateTable
CREATE TABLE "t_dxf_requests" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "id_cad" TEXT,
    "request_date" TEXT NOT NULL,
    "request_time" TEXT NOT NULL,
    "desired_date" TIMESTAMP(3),
    "desired_time" TEXT,
    "purpose" TEXT,
    "remarks" TEXT,
    "history" TEXT,
    "worker" TEXT,
    "status" TEXT,
    "flg_del" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_dxf_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_dxf_requests_uid_key" ON "t_dxf_requests"("uid");
