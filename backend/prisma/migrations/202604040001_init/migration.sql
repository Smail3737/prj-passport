CREATE TABLE "PassportState" (
    "id" TEXT NOT NULL,
    "projects" JSONB NOT NULL,
    "selectedProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PassportState_pkey" PRIMARY KEY ("id")
);
