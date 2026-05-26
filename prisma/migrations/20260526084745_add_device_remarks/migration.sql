-- CreateTable
CREATE TABLE "t_device_remarks" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3),
    "title" TEXT,
    "content" TEXT,
    "flg_del" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_device_remarks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_device_remarks" ADD CONSTRAINT "t_device_remarks_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "t_devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;
