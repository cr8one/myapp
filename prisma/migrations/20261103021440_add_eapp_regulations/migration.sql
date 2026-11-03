-- CreateTable
CREATE TABLE "t_eapp_regulations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_eapp_regulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_eapp_regulation_versions" (
    "id" TEXT NOT NULL,
    "regulation_id" TEXT NOT NULL,
    "version_label" TEXT,
    "file_key" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "uploader_id" TEXT,
    "uploader_name" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_eapp_regulation_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_eapp_regulation_versions_regulation_id_idx" ON "t_eapp_regulation_versions"("regulation_id");

-- AddForeignKey
ALTER TABLE "t_eapp_regulation_versions" ADD CONSTRAINT "t_eapp_regulation_versions_regulation_id_fkey" FOREIGN KEY ("regulation_id") REFERENCES "t_eapp_regulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
