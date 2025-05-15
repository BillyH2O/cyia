-- CreateTable
CREATE TABLE "ChatAnalyticsEntry" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modelUsed" TEXT NOT NULL,
    "wasStreaming" BOOLEAN NOT NULL,
    "evaluateSources" BOOLEAN NOT NULL,
    "useReranker" BOOLEAN NOT NULL,
    "useMultiQuery" BOOLEAN NOT NULL,
    "processingTime" DOUBLE PRECISION,
    "chatId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChatAnalyticsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatAnalyticsEntry_userId_idx" ON "ChatAnalyticsEntry"("userId");

-- CreateIndex
CREATE INDEX "ChatAnalyticsEntry_chatId_idx" ON "ChatAnalyticsEntry"("chatId");

-- CreateIndex
CREATE INDEX "ChatAnalyticsEntry_createdAt_idx" ON "ChatAnalyticsEntry"("createdAt");

-- AddForeignKey
ALTER TABLE "ChatAnalyticsEntry" ADD CONSTRAINT "ChatAnalyticsEntry_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatAnalyticsEntry" ADD CONSTRAINT "ChatAnalyticsEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
