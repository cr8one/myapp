-- CreateTable
CREATE TABLE "m_eapp_system_staff" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "m_eapp_system_staff_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "m_eapp_system_staff" ADD CONSTRAINT "m_eapp_system_staff_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
