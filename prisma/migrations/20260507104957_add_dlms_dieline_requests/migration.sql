-- CreateTable
CREATE TABLE "dlms_dieline_requests" (
    "id" TEXT NOT NULL,
    "request_no" TEXT NOT NULL,
    "flg_del" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT NOT NULL,
    "childId" TEXT,
    "shohin_no" TEXT,
    "location" TEXT,
    "seisan_tanto" TEXT,
    "use_date" TIMESTAMP(3),
    "use_time" TEXT,
    "request_note" TEXT,
    "haichi_kakunin_by" TEXT,
    "haichi_kakunin" TEXT NOT NULL DEFAULT '未手配',
    "kansei_date" TIMESTAMP(3),
    "kansei_time" TEXT,
    "haichi_note" TEXT,
    "dtindt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtupdt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlms_dieline_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dlms_dieline_requests_request_no_key" ON "dlms_dieline_requests"("request_no");

-- AddForeignKey
ALTER TABLE "dlms_dieline_requests" ADD CONSTRAINT "dlms_dieline_requests_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "dlms_dieline_parents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dlms_dieline_requests" ADD CONSTRAINT "dlms_dieline_requests_childId_fkey" FOREIGN KEY ("childId") REFERENCES "dlms_dieline_children"("id") ON DELETE SET NULL ON UPDATE CASCADE;
