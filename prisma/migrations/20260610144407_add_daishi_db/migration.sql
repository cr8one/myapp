-- CreateTable
CREATE TABLE "t_daishi_db" (
    "id" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "file_ai" TEXT,
    "file_dxf" TEXT,
    "file_pdf" TEXT,
    "preview_image" TEXT,
    "remarks" TEXT,
    "flg_del" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_daishi_db_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_daishi_tags" (
    "id" SERIAL NOT NULL,
    "daishi_id" TEXT NOT NULL,
    "tag_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "t_daishi_tags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_daishi_db_uid_key" ON "t_daishi_db"("uid");

-- AddForeignKey
ALTER TABLE "t_daishi_tags" ADD CONSTRAINT "t_daishi_tags_daishi_id_fkey" FOREIGN KEY ("daishi_id") REFERENCES "t_daishi_db"("id") ON DELETE CASCADE ON UPDATE CASCADE;
