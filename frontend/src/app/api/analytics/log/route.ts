import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next"
import { PrismaClient } from '@prisma/client';
// Assurez-vous que le chemin vers authOptions est correct
import { authOptions } from "../../auth/[...nextauth]/route"; 

const prisma = new PrismaClient();

interface LogPayload {
  modelUsed: string;
  wasStreaming: boolean;
  evaluateSources: boolean;
  useReranker: boolean;
  useMultiQuery: boolean;
  temperature?: number;       
  processingTime?: number;
  cost?: number;            
  promptTokens?: number;    
  completionTokens?: number; 
  totalTokens?: number;     
  chatId: string; 
}

export async function POST(request: Request) {
  try {
    // 1. Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }
    
    // 2. Récupérer les données du corps de requête
    const payload: LogPayload = await request.json();
    
    if (!payload.chatId) {
      return NextResponse.json({ error: 'chatId requis' }, { status: 400 });
    }
    
    // 3. Enregistrer l'entrée d'analytique
    const analyticsEntry = await prisma.chatAnalyticsEntry.create({
      data: {
        userId: session.user.id,
        chatId: payload.chatId,
        modelUsed: payload.modelUsed,
        wasStreaming: payload.wasStreaming,
        evaluateSources: payload.evaluateSources,
        useReranker: payload.useReranker,
        useMultiQuery: payload.useMultiQuery,
        ...(payload.temperature !== undefined && { temperature: payload.temperature }),
        processingTime: payload.processingTime,
        cost: payload.cost,
        promptTokens: payload.promptTokens,
        completionTokens: payload.completionTokens,
        totalTokens: payload.totalTokens,
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Analytics data logged successfully',
      id: analyticsEntry.id
    });
    
  } catch (error: any) {
    console.error('Erreur lors de l\'enregistrement des données d\'analytique:', error);
    // Prisma errors often have a code & meta field
    if (error && error.code && error.meta) {
      console.error('Prisma error code:', error.code, 'meta:', error.meta);
    }
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return NextResponse.json({ error: `Erreur serveur: ${errorMessage}`, details: error }, { status: 500 });
  }
} 