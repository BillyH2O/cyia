import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chatService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/chats/[chatId] - Récupérer un chat spécifique avec ses messages
export async function GET(
  req: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const chat = await chatService.getChat(params.chatId, session.user.id);
    
    if (!chat) {
      return NextResponse.json({ error: 'Chat non trouvé' }, { status: 404 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Erreur lors de la récupération du chat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du chat' },
      { status: 500 }
    );
  }
}

// DELETE /api/chats/[chatId] - Supprimer un chat
export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ chatId: string }> | { chatId: string } }
) {
  // Attendre la résolution de params si c'est une promesse
  const resolvedParams = await paramsPromise;
  const chatId = resolvedParams.chatId;
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!chatId) {
    return NextResponse.json({ error: "Chat ID manquant" }, { status: 400 });
  }

  try {
    // Vérifier que le chat appartient bien à l'utilisateur connecté avant de supprimer
    const chat = await prisma.chat.findUnique({
      where: {
        id: chatId,
        userId: session.user.id, // Sécurité
      },
    });

    if (!chat) {
      return NextResponse.json({ error: "Chat non trouvé ou non autorisé" }, { status: 404 });
    }

    // Supprimer le chat (Prisma gère la suppression en cascade des messages associés)
    await prisma.chat.delete({
      where: {
        id: chatId,
      },
    });

    return NextResponse.json({ message: "Chat supprimé avec succès" }, { status: 200 });

  } catch (error) {
    console.error("Erreur lors de la suppression du chat:", error);
    // Gestion spécifique si la suppression échoue à cause de contraintes
    if (error instanceof Error && error.message.includes('constraint')) {
        return NextResponse.json(
          { error: "Impossible de supprimer le chat en raison de dépendances."}, 
          { status: 409 } // Conflict
        );
    }
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression du chat" },
      { status: 500 }
    );
  }
} 