-- CreateTable
CREATE TABLE "dev_companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKana" TEXT,
    "industry" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_projects" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT '商談中',
    "description" TEXT,
    "expectedOrderDate" TIMESTAMP(3),
    "notes" TEXT,
    "primaryCompanyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_project_companies" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "role" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_project_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_exhibitions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dev_exhibitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dev_exhibition_companies" (
    "id" TEXT NOT NULL,
    "exhibitionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_exhibition_companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dev_project_companies_projectId_companyId_key" ON "dev_project_companies"("projectId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "dev_exhibition_companies_exhibitionId_companyId_key" ON "dev_exhibition_companies"("exhibitionId", "companyId");

-- AddForeignKey
ALTER TABLE "dev_projects" ADD CONSTRAINT "dev_projects_primaryCompanyId_fkey" FOREIGN KEY ("primaryCompanyId") REFERENCES "dev_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_companies" ADD CONSTRAINT "dev_project_companies_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "dev_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_companies" ADD CONSTRAINT "dev_project_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "dev_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_exhibition_companies" ADD CONSTRAINT "dev_exhibition_companies_exhibitionId_fkey" FOREIGN KEY ("exhibitionId") REFERENCES "dev_exhibitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_exhibition_companies" ADD CONSTRAINT "dev_exhibition_companies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "dev_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
