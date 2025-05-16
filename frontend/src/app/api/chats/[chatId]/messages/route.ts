import { NextResponse } from 'next/server';
import { chatService } from '@/services/chatService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

interface Source {
  content: string;
  metadata?: Prisma.JsonValue;
}

// POST /api/chats/[chatId]/messages - Ajouter un message à un chat
export async function POST(
  req: Request,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier que le chat appartient à l'utilisateur
    const chat = await chatService.getChat(chatId, session.user.id);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat non trouvé' }, { status: 404 });
    }

    const { content, role, processingTime, model, sources } = await req.json();
    
    // Ajouter le message (pas utilisé dans le frontend)
    const message = await chatService.addMessage({
      content,
      role,
      processingTime,
      model,
      chatId: chatId,
    });

    // Si des sources sont fournies, les ajouter
    if (sources && Array.isArray(sources) && sources.length > 0) {
      await chatService.addSources(
        sources.map((source: Source) => ({
          content: source.content,
          metadata: source.metadata || {},
          messageId: message.id,
        }))
      );
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du message:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'ajout du message' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const { chatId } = params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!chatId) {
    return NextResponse.json({ error: "Chat ID manquant" }, { status: 400 });
  }

  try {
    // Vérifier que le chat appartient bien à l'utilisateur connecté
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId: session.user.id, // Sécurité: on ne peut accéder qu'à ses propres chats
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat non trouvé ou non autorisé" }, { status: 404 });
    }

    // Récupérer les messages du chat
    const messages = await prisma.message.findMany({
      where: {
        chatId: chatId,
      },
      orderBy: {
        createdAt: "asc", // Les plus anciens en premier
      },
      include: {
        sources: true, // Inclure les sources si nécessaire
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Erreur lors de la récupération des messages:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des messages" },
      { status: 500 }
    );
  }
} 