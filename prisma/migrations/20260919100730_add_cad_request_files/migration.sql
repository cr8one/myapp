-- CreateTable
CREATE TABLE "t_cad_request_files" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_cad_request_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_cad_request_files" ADD CONSTRAINT "t_cad_request_files_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "t_cad_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
