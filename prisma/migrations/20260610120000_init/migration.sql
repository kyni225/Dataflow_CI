CREATE TYPE "ColumnType" AS ENUM ('STRING', 'NUMBER', 'INTEGER', 'DATE', 'BOOLEAN', 'ENUM');
CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'PARTIAL', 'FAILED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "email" TEXT NOT NULL,
  "emailVerified" TIMESTAMP(3),
  "image" TEXT,
  "passwordHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Account" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Session" (
  "id" TEXT NOT NULL,
  "sessionToken" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "Source" (
  "id" TEXT NOT NULL,
  "externalId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "ownerLabel" TEXT,
  "expectedFrequency" TEXT,
  "fileFormat" TEXT NOT NULL DEFAULT 'csv',
  "delimiter" TEXT NOT NULL DEFAULT ',',
  "encoding" TEXT NOT NULL DEFAULT 'utf-8',
  "hasHeader" BOOLEAN NOT NULL DEFAULT true,
  "rowConstraints" JSONB,
  "ownerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchemaVersion" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchemaVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SchemaColumn" (
  "id" TEXT NOT NULL,
  "schemaVersionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "ColumnType" NOT NULL,
  "required" BOOLEAN NOT NULL DEFAULT false,
  "regex" TEXT,
  "allowedValues" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "min" DOUBLE PRECISION,
  "max" DOUBLE PRECISION,
  "minLength" INTEGER,
  "maxLength" INTEGER,
  "dateFormat" TEXT,
  "description" TEXT,
  "position" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SchemaColumn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Upload" (
  "id" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "schemaVersionId" TEXT NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "originalFileName" TEXT NOT NULL,
  "storagePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "validRows" INTEGER NOT NULL DEFAULT 0,
  "invalidRows" INTEGER NOT NULL DEFAULT 0,
  "processingStartedAt" TIMESTAMP(3),
  "processingFinishedAt" TIMESTAMP(3),
  "processingDurationMs" INTEGER,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UploadError" (
  "id" TEXT NOT NULL,
  "uploadId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "columnName" TEXT,
  "reason" TEXT NOT NULL,
  "rawValue" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadError_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "UploadValidRecord" (
  "id" TEXT NOT NULL,
  "uploadId" TEXT NOT NULL,
  "rowNumber" INTEGER NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "UploadValidRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "sourceId" TEXT,
  "uploadId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "Source_ownerId_name_key" ON "Source"("ownerId", "name");
CREATE UNIQUE INDEX "Source_ownerId_externalId_key" ON "Source"("ownerId", "externalId");
CREATE INDEX "Source_ownerId_createdAt_idx" ON "Source"("ownerId", "createdAt");
CREATE UNIQUE INDEX "SchemaVersion_sourceId_version_key" ON "SchemaVersion"("sourceId", "version");
CREATE INDEX "SchemaVersion_sourceId_isActive_idx" ON "SchemaVersion"("sourceId", "isActive");
CREATE INDEX "SchemaVersion_createdById_idx" ON "SchemaVersion"("createdById");
CREATE UNIQUE INDEX "SchemaColumn_schemaVersionId_name_key" ON "SchemaColumn"("schemaVersionId", "name");
CREATE INDEX "SchemaColumn_schemaVersionId_position_idx" ON "SchemaColumn"("schemaVersionId", "position");
CREATE INDEX "Upload_sourceId_createdAt_idx" ON "Upload"("sourceId", "createdAt");
CREATE INDEX "Upload_schemaVersionId_idx" ON "Upload"("schemaVersionId");
CREATE INDEX "Upload_uploadedById_createdAt_idx" ON "Upload"("uploadedById", "createdAt");
CREATE INDEX "Upload_status_createdAt_idx" ON "Upload"("status", "createdAt");
CREATE INDEX "UploadError_uploadId_rowNumber_idx" ON "UploadError"("uploadId", "rowNumber");
CREATE INDEX "UploadError_columnName_idx" ON "UploadError"("columnName");
CREATE UNIQUE INDEX "UploadValidRecord_uploadId_rowNumber_key" ON "UploadValidRecord"("uploadId", "rowNumber");
CREATE INDEX "UploadValidRecord_uploadId_idx" ON "UploadValidRecord"("uploadId");
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");
CREATE INDEX "AuditLog_sourceId_createdAt_idx" ON "AuditLog"("sourceId", "createdAt");
CREATE INDEX "AuditLog_uploadId_createdAt_idx" ON "AuditLog"("uploadId", "createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Source" ADD CONSTRAINT "Source_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SchemaVersion" ADD CONSTRAINT "SchemaVersion_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SchemaVersion" ADD CONSTRAINT "SchemaVersion_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SchemaColumn" ADD CONSTRAINT "SchemaColumn_schemaVersionId_fkey"
  FOREIGN KEY ("schemaVersionId") REFERENCES "SchemaVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Upload" ADD CONSTRAINT "Upload_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Upload" ADD CONSTRAINT "Upload_schemaVersionId_fkey"
  FOREIGN KEY ("schemaVersionId") REFERENCES "SchemaVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Upload" ADD CONSTRAINT "Upload_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UploadError" ADD CONSTRAINT "UploadError_uploadId_fkey"
  FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UploadValidRecord" ADD CONSTRAINT "UploadValidRecord_uploadId_fkey"
  FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_sourceId_fkey"
  FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_uploadId_fkey"
  FOREIGN KEY ("uploadId") REFERENCES "Upload"("id") ON DELETE SET NULL ON UPDATE CASCADE;
