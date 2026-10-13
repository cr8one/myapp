-- CreateTable
CREATE TABLE "m_mobile_service_settings" (
    "service_key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "m_mobile_service_settings_pkey" PRIMARY KEY ("service_key")
);

-- 初期データ: 最初に携帯公開するサービスはBPMSのみ
INSERT INTO "m_mobile_service_settings" ("service_key", "enabled", "updated_at")
VALUES ('bpms', true, CURRENT_TIMESTAMP)
ON CONFLICT ("service_key") DO NOTHING;
