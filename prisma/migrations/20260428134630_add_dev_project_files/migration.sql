-- CreateTable
CREATE TABLE "dev_project_files" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_key" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,

    CONSTRAINT "dev_project_files_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "dev_project_files" ADD CONSTRAINT "dev_project_files_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
