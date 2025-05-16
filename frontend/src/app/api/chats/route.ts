import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chatService';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/chats - Récupérer tous les chats de l'utilisateur connecté
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    const chats = await prisma.chat.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc", // Les plus récents en premier
      },
      select: { // Sélectionner seulement les champs nécessaires
        id: true,
        title: true,
        updatedAt: true,
      }
    });
    return NextResponse.json(chats);
  } catch (error) {
    console.error("Erreur lors de la récupération des chats:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des chats" },
      { status: 500 }
    );
  }
}

// POST /api/chats - Créer un nouveau chat
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { title } = await req.json();
    
    const newChat = await chatService.createChat({
      title: title || 'Nouvelle conversation',
      userId: session.user.id,
    });

    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création du chat:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création du chat' },
      { status: 500 }
    );
  }
} 