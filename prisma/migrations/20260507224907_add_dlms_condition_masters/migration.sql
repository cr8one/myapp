-- CreateTable
CREATE TABLE "dlms_condition_masters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dlms_condition_masters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dlms_condition_masters_name_key" ON "dlms_condition_masters"("name");
