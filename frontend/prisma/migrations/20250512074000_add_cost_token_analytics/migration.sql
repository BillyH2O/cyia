-- AlterTable
ALTER TABLE "ChatAnalyticsEntry" ADD COLUMN     "completionTokens" INTEGER,
ADD COLUMN     "cost" DOUBLE PRECISION,
ADD COLUMN     "promptTokens" INTEGER,
ADD COLUMN     "totalTokens" INTEGER;
