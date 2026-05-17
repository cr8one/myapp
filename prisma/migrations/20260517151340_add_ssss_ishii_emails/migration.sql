-- CreateTable
CREATE TABLE "ssss_ishii_emails" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ssss_ishii_emails_pkey" PRIMARY KEY ("id")
);
