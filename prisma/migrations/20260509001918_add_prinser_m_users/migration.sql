-- CreateTable
CREATE TABLE "prinser_m_users" (
    "uid" TEXT NOT NULL,
    "upass" TEXT,
    "unm" TEXT,
    "ukana" TEXT,
    "kencd" TEXT,
    "biko" TEXT,
    "ukbn" TEXT,
    "ulevel" TEXT,
    "listflg" TEXT,
    "kanriuid" TEXT,
    "bumon_cd" TEXT,
    "utel" TEXT,
    "ufax" TEXT,
    "umail" TEXT,
    "del_flg" TEXT,
    "dtindt" TEXT,
    "dtupdt" TEXT,
    "kanribumon" TEXT,
    "jimusyo" TEXT,
    "gaichu_flg" TEXT,
    "gaichu_cd" TEXT,
    "rawData" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prinser_m_users_pkey" PRIMARY KEY ("uid")
);
