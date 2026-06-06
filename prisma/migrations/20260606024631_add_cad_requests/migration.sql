-- CreateTable
CREATE TABLE "t_cad_requests" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "request_time" TEXT NOT NULL,
    "requester_id" TEXT,
    "requester_name" TEXT NOT NULL,
    "department" TEXT,
    "content" TEXT,
    "client" TEXT,
    "title" TEXT,
    "genre" TEXT,
    "hinmoku" TEXT,
    "hinban" TEXT,
    "dieline_no" TEXT,
    "develop_y" DOUBLE PRECISION,
    "develop_x" DOUBLE PRECISION,
    "paper" TEXT,
    "finish_count" INTEGER,
    "desired_date" TIMESTAMP(3),
    "desired_time" TEXT,
    "tray" TEXT,
    "degi_spec" TEXT,
    "tray_count" INTEGER,
    "pocket" TEXT,
    "remarks" TEXT,
    "flg_del" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_cad_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_cad_requests_uid_key" ON "t_cad_requests"("uid");

-- AddForeignKey
ALTER TABLE "t_cad_requests" ADD CONSTRAINT "t_cad_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
