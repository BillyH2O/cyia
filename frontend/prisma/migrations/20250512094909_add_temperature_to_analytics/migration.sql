-- DropIndex
DROP INDEX "ChatAnalyticsEntry_chatId_idx";

-- DropIndex
DROP INDEX "ChatAnalyticsEntry_createdAt_idx";

-- DropIndex
DROP INDEX "ChatAnalyticsEntry_userId_idx";

-- AlterTable
ALTER TABLE "ChatAnalyticsEntry" ADD COLUMN     "temperature" DOUBLE PRECISION DEFAULT 1.0,
ALTER COLUMN "wasStreaming" SET DEFAULT false,
ALTER COLUMN "evaluateSources" SET DEFAULT false,
ALTER COLUMN "useReranker" SET DEFAULT false,
ALTER COLUMN "useMultiQuery" SET DEFAULT false;
