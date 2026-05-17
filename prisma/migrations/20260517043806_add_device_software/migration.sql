-- CreateTable
CREATE TABLE "t_device_software" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "software_id" INTEGER NOT NULL,
    "version" TEXT,
    "note" TEXT,
    "flg_del" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_device_software_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_device_software" ADD CONSTRAINT "t_device_software_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "t_devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_device_software" ADD CONSTRAINT "t_device_software_software_id_fkey" FOREIGN KEY ("software_id") REFERENCES "m_software"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
