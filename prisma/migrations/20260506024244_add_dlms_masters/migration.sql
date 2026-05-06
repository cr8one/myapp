-- CreateTable
CREATE TABLE "dlms_format_masters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'mm',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlms_format_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dlms_part_masters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "shape" TEXT NOT NULL DEFAULT 'rect',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlms_part_masters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dlms_note_masters" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "font_size" INTEGER NOT NULL DEFAULT 12,
    "color" TEXT NOT NULL DEFAULT '#1a1a1a',
    "font_weight" TEXT NOT NULL DEFAULT 'normal',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlms_note_masters_pkey" PRIMARY KEY ("id")
);
