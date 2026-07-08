-- CreateTable
CREATE TABLE "t_cad_work_logs" (
    "id" TEXT NOT NULL,
    "creator" TEXT NOT NULL,
    "work_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "request_no" TEXT,
    "department_group" TEXT,
    "person_in_charge" TEXT,
    "customer" TEXT,
    "title" TEXT,
    "content" TEXT,
    "parts_name" TEXT,
    "quantity" INTEGER,
    "paper_name" TEXT,
    "remarks" TEXT,
    "flg_same_day" INTEGER NOT NULL DEFAULT 0,
    "flg_del" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_cad_work_logs_pkey" PRIMARY KEY ("id")
);
