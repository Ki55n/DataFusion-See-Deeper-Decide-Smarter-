-- AlterTable
ALTER TABLE "files" ADD COLUMN     "file_path" TEXT,
ADD COLUMN     "table_name" TEXT;

-- CreateIndex
CREATE INDEX "files_projectId_idx" ON "files"("projectId");

-- CreateIndex
CREATE INDEX "projects_userId_idx" ON "projects"("userId");

-- CreateIndex
CREATE INDEX "visualizations_fileId_idx" ON "visualizations"("fileId");

-- CreateIndex
CREATE INDEX "visualizations_userId_idx" ON "visualizations"("userId");
