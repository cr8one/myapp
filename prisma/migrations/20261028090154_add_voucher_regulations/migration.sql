-- CreateTable
CREATE TABLE "t_voucher_regulations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "remarks" TEXT,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "registrant_id" TEXT,
    "registrant_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_voucher_regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_voucher_regulation_files" (
    "id" TEXT NOT NULL,
    "regulation_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_voucher_regulation_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_voucher_regulation_files_regulation_id_idx" ON "t_voucher_regulation_files"("regulation_id");

-- AddForeignKey
ALTER TABLE "t_voucher_regulation_files" ADD CONSTRAINT "t_voucher_regulation_files_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "t_voucher_regulations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
