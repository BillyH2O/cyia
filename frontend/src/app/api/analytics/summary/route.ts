import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { PrismaClient, ChatAnalyticsEntry } from '@prisma/client';
import { authOptions } from "@/lib/authOptions";

const prisma = new PrismaClient();

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function GET() {
  // 1. Authentification
  const session = await getServerSession(authOptions); // Pass the authOptions
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 2. Récupérer toutes les entrées pour cet utilisateur
    const entries = await prisma.chatAnalyticsEntry.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'asc' }, // Trier par date pour le graphique temporel
    });

    // 3. Calculer les statistiques agrégées
    const totalMessages = entries.length;

    const modelUsageMap = new Map<string, number>();
    const featureUsage = {
      evaluateSources: 0,
      useReranker: 0,
      useMultiQuery: 0,
      useStreaming: 0,
    };
    const consumptionMap = new Map<string, number>();

    // Nouvelles métriques pour tokens et coûts
    let totalCost = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;
    let totalTokens = 0;
    let entriesWithTokens = 0;

    entries.forEach((entry: ChatAnalyticsEntry) => {
      // Compter usage modèle
      modelUsageMap.set(entry.modelUsed, (modelUsageMap.get(entry.modelUsed) || 0) + 1);

      // Compter usage features
      if (entry.evaluateSources) featureUsage.evaluateSources++;
      if (entry.useReranker) featureUsage.useReranker++;
      if (entry.useMultiQuery) featureUsage.useMultiQuery++;
      if (entry.wasStreaming) featureUsage.useStreaming++;

      // Compter consommation par jour
      const dateStr = formatDate(entry.createdAt);
      consumptionMap.set(dateStr, (consumptionMap.get(dateStr) || 0) + 1);

      // Accumuler métriques de tokens et coûts
      if (entry.cost !== null) totalCost += entry.cost;
      if (entry.promptTokens !== null) totalPromptTokens += entry.promptTokens;
      if (entry.completionTokens !== null) totalCompletionTokens += entry.completionTokens;
      if (entry.totalTokens !== null) totalTokens += entry.totalTokens;
      
      // Compter les entrées avec des données de tokens pour calculer les moyennes
      if (entry.totalTokens !== null) entriesWithTokens++;
    });

    // Calculer les moyennes (éviter division par zéro)
    const avgCostPerReq = entriesWithTokens > 0 ? totalCost / entriesWithTokens : 0;
    const avgPromptTokensPerReq = entriesWithTokens > 0 ? totalPromptTokens / entriesWithTokens : 0;
    const avgCompletionTokensPerReq = entriesWithTokens > 0 ? totalCompletionTokens / entriesWithTokens : 0;
    const avgTotalTokensPerReq = entriesWithTokens > 0 ? totalTokens / entriesWithTokens : 0;

    // Formater les données pour la réponse
    const modelUsage = Array.from(modelUsageMap.entries()).map(([name, count]) => ({ name, count }));
    const consumptionOverTime = Array.from(consumptionMap.entries()).map(([date, count]) => ({ date, count }));

    const summary = {
      totalMessages,
      modelUsage,
      featureUsage,
      consumptionOverTime,
      // Nouvelles métriques
      avgCostPerReq,
      avgPromptTokensPerReq,
      avgCompletionTokensPerReq,
      avgTotalTokensPerReq,
      // Totaux (pour information)
      totalCost,
      totalTokens
    };

    return NextResponse.json(summary);

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: 'Failed to fetch analytics summary', details: errorMessage }, { status: 500 });
  }
} 