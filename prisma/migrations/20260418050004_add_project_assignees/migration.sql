-- CreateTable
CREATE TABLE "dev_project_assignees" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dev_project_assignees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "dev_project_assignees_project_id_user_id_key" ON "dev_project_assignees"("project_id", "user_id");

-- AddForeignKey
ALTER TABLE "dev_project_assignees" ADD CONSTRAINT "dev_project_assignees_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "dev_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dev_project_assignees" ADD CONSTRAINT "dev_project_assignees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
