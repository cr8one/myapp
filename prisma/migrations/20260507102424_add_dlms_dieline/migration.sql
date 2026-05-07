-- CreateTable
CREATE TABLE "dlms_dieline_parents" (
    "id" TEXT NOT NULL,
    "uid_ntemp" TEXT NOT NULL,
    "flg_del" INTEGER NOT NULL DEFAULT 0,
    "kyugataban" TEXT,
    "genre" TEXT,
    "spec" TEXT,
    "hinmoku" TEXT,
    "developy" DOUBLE PRECISION,
    "developx" DOUBLE PRECISION,
    "sizey" DOUBLE PRECISION,
    "sizex" DOUBLE PRECISION,
    "widthy" DOUBLE PRECISION,
    "dtindt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtupdt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlms_dieline_parents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dlms_dieline_conditions" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "dlms_dieline_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dlms_dieline_children" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "edaban" TEXT NOT NULL,
    "han" TEXT,
    "me" TEXT,
    "kiri" TEXT,
    "men" TEXT,
    "sizey" DOUBLE PRECISION,
    "sizex" DOUBLE PRECISION,
    "咥え" DOUBLE PRECISION,
    "location" TEXT,
    "dxf_filename" TEXT,
    "flg_del" INTEGER NOT NULL DEFAULT 0,
    "dtindt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dtupdt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dlms_dieline_children_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dlms_dieline_parents_uid_ntemp_key" ON "dlms_dieline_parents"("uid_ntemp");

-- AddForeignKey
ALTER TABLE "dlms_dieline_conditions" ADD CONSTRAINT "dlms_dieline_conditions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "dlms_dieline_parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dlms_dieline_children" ADD CONSTRAINT "dlms_dieline_children_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "dlms_dieline_parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
