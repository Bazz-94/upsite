-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "VersionKind" AS ENUM ('draft', 'published');

-- CreateEnum
CREATE TYPE "SectionType" AS ENUM ('paragraph', 'list', 'image');

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "navOrder" INTEGER NOT NULL,
    "navVisible" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageVersion" (
    "rowId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "kind" "VersionKind" NOT NULL,
    "title" TEXT NOT NULL,
    "heroImageName" TEXT,

    CONSTRAINT "PageVersion_pkey" PRIMARY KEY ("rowId")
);

-- CreateTable
CREATE TABLE "Section" (
    "rowId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "kind" "VersionKind" NOT NULL,
    "position" INTEGER NOT NULL,
    "type" "SectionType" NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("rowId")
);

-- CreateTable
CREATE TABLE "ParagraphSection" (
    "sectionRowId" TEXT NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,

    CONSTRAINT "ParagraphSection_pkey" PRIMARY KEY ("sectionRowId")
);

-- CreateTable
CREATE TABLE "ImageSection" (
    "sectionRowId" TEXT NOT NULL,
    "imageName" TEXT NOT NULL,
    "caption" TEXT,

    CONSTRAINT "ImageSection_pkey" PRIMARY KEY ("sectionRowId")
);

-- CreateTable
CREATE TABLE "ListSection" (
    "sectionRowId" TEXT NOT NULL,
    "title" TEXT,

    CONSTRAINT "ListSection_pkey" PRIMARY KEY ("sectionRowId")
);

-- CreateTable
CREATE TABLE "ListField" (
    "rowId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "sectionRowId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ListField_pkey" PRIMARY KEY ("rowId")
);

-- CreateTable
CREATE TABLE "ListItem" (
    "rowId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "sectionRowId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "ListItem_pkey" PRIMARY KEY ("rowId")
);

-- CreateTable
CREATE TABLE "ListValue" (
    "rowId" TEXT NOT NULL,
    "itemRowId" TEXT NOT NULL,
    "fieldRowId" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "ListValue_pkey" PRIMARY KEY ("rowId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PageVersion_pageId_kind_key" ON "PageVersion"("pageId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "Section_pageId_kind_sectionId_key" ON "Section"("pageId", "kind", "sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Section_pageId_kind_position_key" ON "Section"("pageId", "kind", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ListField_sectionRowId_fieldId_key" ON "ListField"("sectionRowId", "fieldId");

-- CreateIndex
CREATE UNIQUE INDEX "ListField_sectionRowId_position_key" ON "ListField"("sectionRowId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "ListItem_sectionRowId_itemId_key" ON "ListItem"("sectionRowId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "ListItem_sectionRowId_position_key" ON "ListItem"("sectionRowId", "position");

-- CreateIndex
CREATE INDEX "ListValue_fieldRowId_idx" ON "ListValue"("fieldRowId");

-- CreateIndex
CREATE UNIQUE INDEX "ListValue_itemRowId_fieldRowId_key" ON "ListValue"("itemRowId", "fieldRowId");

-- AddForeignKey
ALTER TABLE "PageVersion" ADD CONSTRAINT "PageVersion_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Section" ADD CONSTRAINT "Section_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParagraphSection" ADD CONSTRAINT "ParagraphSection_sectionRowId_fkey" FOREIGN KEY ("sectionRowId") REFERENCES "Section"("rowId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImageSection" ADD CONSTRAINT "ImageSection_sectionRowId_fkey" FOREIGN KEY ("sectionRowId") REFERENCES "Section"("rowId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListSection" ADD CONSTRAINT "ListSection_sectionRowId_fkey" FOREIGN KEY ("sectionRowId") REFERENCES "Section"("rowId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListField" ADD CONSTRAINT "ListField_sectionRowId_fkey" FOREIGN KEY ("sectionRowId") REFERENCES "ListSection"("sectionRowId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListItem" ADD CONSTRAINT "ListItem_sectionRowId_fkey" FOREIGN KEY ("sectionRowId") REFERENCES "ListSection"("sectionRowId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListValue" ADD CONSTRAINT "ListValue_itemRowId_fkey" FOREIGN KEY ("itemRowId") REFERENCES "ListItem"("rowId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ListValue" ADD CONSTRAINT "ListValue_fieldRowId_fkey" FOREIGN KEY ("fieldRowId") REFERENCES "ListField"("rowId") ON DELETE CASCADE ON UPDATE CASCADE;

