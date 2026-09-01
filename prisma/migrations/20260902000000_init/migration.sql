-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('DRAFT', 'VALIDATED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('FISCAL_YEAR', 'CALENDAR_YEAR', 'ACADEMIC_YEAR', 'SEMESTER', 'QUARTER', 'MONTH', 'AS_OF_DATE', 'DATE_RANGE');

-- CreateEnum
CREATE TYPE "ImportMode" AS ENUM ('REPLACE_DATASET', 'APPEND');

-- CreateEnum
CREATE TYPE "ValidationSeverity" AS ENUM ('INFO', 'WARNING', 'ERROR', 'CONFLICT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'IMPORT', 'VALIDATE', 'PUBLISH', 'UNPUBLISH', 'ARCHIVE', 'RESTORE', 'LOGIN', 'LOGIN_FAILED', 'LOGOUT');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'DOCUMENT', 'SPREADSHEET', 'OTHER');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "summary" TEXT NOT NULL,
    "previousJson" TEXT,
    "nextJson" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "College" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campusId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "College_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollegeAlias" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "collegeId" TEXT NOT NULL,

    CONSTRAINT "CollegeAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campusId" TEXT,
    "code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryDefinition" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CategoryDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportingPeriod" (
    "id" TEXT NOT NULL,
    "type" "PeriodType" NOT NULL,
    "label" TEXT NOT NULL,
    "fiscalYear" INTEGER,
    "calendarYear" INTEGER,
    "academicYearStart" INTEGER,
    "academicYearEnd" INTEGER,
    "semester" INTEGER,
    "quarter" INTEGER,
    "month" INTEGER,
    "asOfDate" TIMESTAMP(3),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "ReportingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dataset" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatasetVersion" (
    "id" TEXT NOT NULL,
    "datasetId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "sourceFile" TEXT,
    "worksheet" TEXT,
    "importedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "periodLabel" TEXT,
    "asOfDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DatasetVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT,
    "adminId" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT,
    "mode" "ImportMode" NOT NULL DEFAULT 'REPLACE_DATASET',
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "summaryJson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ValidationIssue" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "severity" "ValidationSeverity" NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sourceRef" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortTitle" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "higherIsBetter" BOOLEAN NOT NULL DEFAULT true,
    "sourceDataset" TEXT,
    "periodType" "PeriodType",
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "homepageVisible" BOOLEAN NOT NULL DEFAULT false,
    "detailsHref" TEXT,
    "groupName" TEXT,

    CONSTRAINT "MetricDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricObservation" (
    "id" TEXT NOT NULL,
    "metricId" TEXT NOT NULL,
    "datasetVersionId" TEXT,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "value" DOUBLE PRECISION,
    "numerator" DOUBLE PRECISION,
    "denominator" DOUBLE PRECISION,
    "rawValue" TEXT,
    "periodId" TEXT,
    "campusId" TEXT,
    "collegeId" TEXT,
    "asOfDate" TIMESTAMP(3),
    "sourceNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MetricObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicProgram" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "campusId" TEXT,
    "collegeId" TEXT,
    "name" TEXT NOT NULL,
    "programType" TEXT,
    "specializedMajor" TEXT,
    "copcNumber" TEXT,
    "copcIssuanceDate" TIMESTAMP(3),
    "copcRaw" TEXT,
    "accreditationLevel" TEXT,
    "accreditationRaw" TEXT,
    "validityStart" TIMESTAMP(3),
    "validityEnd" TIMESTAMP(3),
    "validityRaw" TEXT,
    "accreditable" BOOLEAN,
    "accredited" BOOLEAN,
    "programStatus" TEXT,
    "phaseOut" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "sourceRow" INTEGER,

    CONSTRAINT "AcademicProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultySnapshot" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "campusId" TEXT,
    "collegeId" TEXT,
    "asOfDate" TIMESTAMP(3),
    "total" INTEGER,
    "countsJson" TEXT NOT NULL,
    "sourceRow" INTEGER,

    CONSTRAINT "FacultySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffSnapshot" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "campusId" TEXT,
    "department" TEXT,
    "office" TEXT,
    "unit" TEXT,
    "asOfDate" TIMESTAMP(3),
    "total" INTEGER,
    "countsJson" TEXT NOT NULL,
    "sourceRow" INTEGER,

    CONSTRAINT "StaffSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrollmentObservation" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "campusId" TEXT,
    "collegeId" TEXT,
    "programName" TEXT NOT NULL,
    "periodId" TEXT,
    "headcount" INTEGER,
    "sourceRow" INTEGER,

    CONSTRAINT "EnrollmentObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicensureObservation" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "campusId" TEXT,
    "programName" TEXT NOT NULL,
    "examination" TEXT,
    "examMonth" TEXT,
    "fiscalYear" INTEGER NOT NULL,
    "firstTimeTakers" INTEGER,
    "firstTimePassers" INTEGER,
    "passingRate" DOUBLE PRECISION,
    "rawPercentage" TEXT,
    "sourceRow" INTEGER,
    "isTotalRow" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LicensureObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAward" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "recipient" TEXT NOT NULL,
    "programName" TEXT,
    "eventName" TEXT,
    "awardRank" TEXT,
    "occurredOn" TIMESTAMP(3),
    "occurredRaw" TEXT,
    "venue" TEXT,
    "level" TEXT,
    "photoPath" TEXT,
    "description" TEXT,
    "sourceRow" INTEGER,

    CONSTRAINT "StudentAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployabilityObservation" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "cohortLabel" TEXT NOT NULL,
    "collegeId" TEXT,
    "collegeName" TEXT NOT NULL,
    "graduates" INTEGER,
    "employed" INTEGER,
    "rate" DOUBLE PRECISION,
    "rawValue" TEXT,
    "source" TEXT,
    "reportingYear" INTEGER,
    "sourceRow" INTEGER,

    CONSTRAINT "EmployabilityObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceIndicator" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "programMfo" TEXT NOT NULL,
    "indicatorType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "unit" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PerformanceIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceObservation" (
    "id" TEXT NOT NULL,
    "indicatorId" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "fiscalYear" INTEGER NOT NULL,
    "periodId" TEXT,
    "targetRaw" TEXT,
    "targetValue" DOUBLE PRECISION,
    "accomplishmentRaw" TEXT,
    "accomplishmentValue" DOUBLE PRECISION,
    "numerator" DOUBLE PRECISION,
    "denominator" DOUBLE PRECISION,
    "unit" TEXT,
    "asOfDate" TIMESTAMP(3),
    "isPartial" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "sourceRow" INTEGER,

    CONSTRAINT "PerformanceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchCompletion" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "fiscalYear" INTEGER NOT NULL,
    "quarter" INTEGER,
    "title" TEXT NOT NULL,
    "authorsJson" TEXT NOT NULL,
    "completionDate" TIMESTAMP(3),
    "collegeId" TEXT,
    "campusId" TEXT,
    "sourceRow" INTEGER,

    CONSTRAINT "ResearchCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchPublication" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "fiscalYear" INTEGER NOT NULL,
    "originalTitle" TEXT,
    "publishedTitle" TEXT NOT NULL,
    "authorsJson" TEXT NOT NULL,
    "journal" TEXT,
    "indexing" TEXT,
    "doi" TEXT,
    "publishedAt" TIMESTAMP(3),
    "sourceRow" INTEGER,

    CONSTRAINT "ResearchPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchUtilization" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "fiscalYear" INTEGER NOT NULL,
    "campusId" TEXT,
    "collegeCode" TEXT,
    "productName" TEXT,
    "researchTitle" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "authorsJson" TEXT NOT NULL,
    "beneficiary" TEXT,
    "patentOrDescription" TEXT,
    "sourceRow" INTEGER,

    CONSTRAINT "ResearchUtilization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchGrant" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "principalInvestigator" TEXT,
    "fundingAgency" TEXT,
    "amount" DECIMAL(65,30),
    "duration" TEXT,
    "approvedAt" TIMESTAMP(3),
    "grantStatus" TEXT,
    "collegeId" TEXT,
    "fundingType" TEXT,

    CONSTRAINT "ResearchGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionProgram" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "borReference" TEXT,
    "approvedAt" TIMESTAMP(3),
    "campusId" TEXT,
    "collegeId" TEXT,
    "office" TEXT,
    "projectLeader" TEXT,
    "programStatus" TEXT,
    "beneficiaries" TEXT,
    "location" TEXT,

    CONSTRAINT "ExtensionProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtensionPartner" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "organization" TEXT NOT NULL,
    "organizationType" TEXT,
    "location" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "agreement" TEXT,
    "programId" TEXT,
    "partnerStatus" TEXT,

    CONSTRAINT "ExtensionPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandAsset" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "campusId" TEXT,
    "landArea" TEXT,
    "titleReference" TEXT,
    "location" TEXT,
    "remarks" TEXT,

    CONSTRAINT "LandAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuildingAsset" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "campusId" TEXT,
    "buildingType" TEXT,
    "floorArea" TEXT,
    "yearCompleted" INTEGER,
    "buildingStatus" TEXT,

    CONSTRAINT "BuildingAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LaboratoryAsset" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "campusId" TEXT,
    "collegeId" TEXT,
    "office" TEXT,
    "labType" TEXT,
    "capabilitySummary" TEXT,

    CONSTRAINT "LaboratoryAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccommodationAsset" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "campusId" TEXT,
    "capacity" TEXT,
    "accommodationStatus" TEXT,

    CONSTRAINT "AccommodationAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleAsset" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "name" TEXT NOT NULL,
    "vehicleType" TEXT,
    "plateOrPropertyNo" TEXT,
    "campusId" TEXT,
    "office" TEXT,
    "yearModel" TEXT,
    "operationalStatus" TEXT,

    CONSTRAINT "VehicleAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfrastructureProject" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "classification" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "campusId" TEXT,
    "contractor" TEXT,
    "projectCost" DECIMAL(65,30),
    "sourceOfFund" TEXT,
    "startDate" TIMESTAMP(3),
    "targetCompletion" TIMESTAMP(3),
    "physicalAccomplishment" DOUBLE PRECISION,
    "financialAccomplishment" DOUBLE PRECISION,
    "projectStatus" TEXT,
    "delayNotes" TEXT,
    "manager" TEXT,
    "priorityLevel" TEXT,
    "estimatedCost" DECIMAL(65,30),
    "justification" TEXT,
    "targetYear" INTEGER,

    CONSTRAINT "InfrastructureProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfrastructureProgressReport" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "reportingMonth" TIMESTAMP(3) NOT NULL,
    "physicalAccomplishment" DOUBLE PRECISION,
    "financialAccomplishment" DOUBLE PRECISION,
    "narrative" TEXT,
    "issues" TEXT,
    "correctiveAction" TEXT,
    "photosJson" TEXT,

    CONSTRAINT "InfrastructureProgressReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRecord" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "fiscalYear" INTEGER NOT NULL,
    "fundingSource" TEXT,
    "programPap" TEXT,
    "category" TEXT,
    "budget" DECIMAL(65,30),
    "allotment" DECIMAL(65,30),
    "obligation" DECIMAL(65,30),
    "disbursement" DECIMAL(65,30),
    "balance" DECIMAL(65,30),
    "publiclyPublishable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "BudgetRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternationalPartner" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "institution" TEXT NOT NULL,
    "country" TEXT,
    "countryCode" TEXT,
    "agreementType" TEXT,
    "startDate" TIMESTAMP(3),
    "expiration" TIMESTAMP(3),
    "activities" TEXT,
    "responsibleOffice" TEXT,
    "partnerStatus" TEXT,

    CONSTRAINT "InternationalPartner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternationalMembership" (
    "id" TEXT NOT NULL,
    "datasetVersionId" TEXT NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'DRAFT',
    "organization" TEXT NOT NULL,
    "countryOrRegion" TEXT,
    "membershipType" TEXT,
    "startYear" INTEGER,
    "validity" TEXT,
    "membershipStatus" TEXT,

    CONSTRAINT "InternationalMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Official" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "office" TEXT,
    "email" TEXT,
    "section" TEXT,
    "photoPath" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Official_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalPage" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionalPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlagshipProgram" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "shortDescription" TEXT,
    "fullDescription" TEXT,
    "office" TEXT,
    "programLead" TEXT,
    "startDate" TIMESTAMP(3),
    "programStatus" TEXT,
    "bannerPath" TEXT,
    "galleryJson" TEXT,
    "kpiJson" TEXT,
    "linksJson" TEXT,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FlagshipProgram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRecord" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "effectiveYear" INTEGER,
    "filePath" TEXT,
    "externalUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "version" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DocumentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "kind" "MediaKind" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "altText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Campus_code_key" ON "Campus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "College_code_key" ON "College"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CollegeAlias_alias_key" ON "CollegeAlias"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryDefinition_type_code_key" ON "CategoryDefinition"("type", "code");

-- CreateIndex
CREATE INDEX "ReportingPeriod_type_fiscalYear_idx" ON "ReportingPeriod"("type", "fiscalYear");

-- CreateIndex
CREATE INDEX "ReportingPeriod_type_academicYearStart_semester_idx" ON "ReportingPeriod"("type", "academicYearStart", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Dataset_code_key" ON "Dataset"("code");

-- CreateIndex
CREATE UNIQUE INDEX "DatasetVersion_datasetId_versionNumber_key" ON "DatasetVersion"("datasetId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_code_key" ON "MetricDefinition"("code");

-- CreateIndex
CREATE INDEX "MetricObservation_metricId_status_idx" ON "MetricObservation"("metricId", "status");

-- CreateIndex
CREATE INDEX "MetricObservation_status_campusId_idx" ON "MetricObservation"("status", "campusId");

-- CreateIndex
CREATE INDEX "EnrollmentObservation_status_periodId_idx" ON "EnrollmentObservation"("status", "periodId");

-- CreateIndex
CREATE INDEX "LicensureObservation_status_fiscalYear_idx" ON "LicensureObservation"("status", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceIndicator_code_key" ON "PerformanceIndicator"("code");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionalPage_slug_key" ON "InstitutionalPage"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "College" ADD CONSTRAINT "College_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeAlias" ADD CONSTRAINT "CollegeAlias_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatasetVersion" ADD CONSTRAINT "DatasetVersion_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "Dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_datasetVersionId_fkey" FOREIGN KEY ("datasetVersionId") REFERENCES "DatasetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ValidationIssue" ADD CONSTRAINT "ValidationIssue_datasetVersionId_fkey" FOREIGN KEY ("datasetVersionId") REFERENCES "DatasetVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "MetricDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_datasetVersionId_fkey" FOREIGN KEY ("datasetVersionId") REFERENCES "DatasetVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricObservation" ADD CONSTRAINT "MetricObservation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReportingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProgram" ADD CONSTRAINT "AcademicProgram_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicProgram" ADD CONSTRAINT "AcademicProgram_collegeId_fkey" FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrollmentObservation" ADD CONSTRAINT "EnrollmentObservation_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "ReportingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceObservation" ADD CONSTRAINT "PerformanceObservation_indicatorId_fkey" FOREIGN KEY ("indicatorId") REFERENCES "PerformanceIndicator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfrastructureProgressReport" ADD CONSTRAINT "InfrastructureProgressReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "InfrastructureProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

