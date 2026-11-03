-- AlterTable
ALTER TABLE "t_acct_trip_expenses" ADD COLUMN     "trip_area" TEXT,
ADD COLUMN     "trip_purpose" TEXT;

-- CreateTable
CREATE TABLE "t_eapp_trip_areas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_eapp_trip_areas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_eapp_trip_areas_name_key" ON "t_eapp_trip_areas"("name");
