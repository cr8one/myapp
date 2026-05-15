-- CreateTable
CREATE TABLE "m_terminal_masters" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "flg_del" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_terminal_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_devices" (
    "device_id" SERIAL NOT NULL,
    "asset_no" TEXT,
    "device_name" TEXT NOT NULL,
    "hostname" TEXT,
    "model_id" INTEGER,
    "serial_no" TEXT,
    "os_version" TEXT,
    "memory_size" TEXT,
    "storage_size" TEXT,
    "location" TEXT,
    "user_id" TEXT,
    "purchase_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "status" TEXT,
    "management_type" TEXT,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_devices_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "t_device_ips" (
    "id" SERIAL NOT NULL,
    "device_id" INTEGER NOT NULL,
    "ip" TEXT NOT NULL,
    "subnet" TEXT,
    "gateway" TEXT,
    "interface" TEXT,
    "note" TEXT,
    "flg_del" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "t_device_ips_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "t_device_ips" ADD CONSTRAINT "t_device_ips_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "t_devices"("device_id") ON DELETE RESTRICT ON UPDATE CASCADE;
