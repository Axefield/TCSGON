-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "message" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "activity_logs_project_id_idx" ON "activity_logs"("project_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "projects_status_created_at_idx" ON "projects"("status", "created_at");

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
