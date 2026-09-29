-- CreateIndex
CREATE UNIQUE INDEX "ContextKey_projectId_label_key" ON "ContextKey"("projectId", "label");

-- CreateIndex
CREATE UNIQUE INDEX "Experiment_projectId_name_key" ON "Experiment"("projectId", "name");

