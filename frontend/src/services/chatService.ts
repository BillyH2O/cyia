// Service pour gérer les opérations sur les chats
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChatInput {
  title?: string;
  userId: string;
}

export interface MessageInput {
  content: string;
  role: 'user' | 'bot';
  processingTime?: number;
  model?: string;
  chatId: string;
}

export interface SourceInput {
  content: string;
  metadata?: Prisma.InputJsonValue;
  messageId: string;
}

export const chatService = {
  // Récupérer tous les chats d'un utilisateur
  async getUserChats(userId: string) {
    return prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 1, // Juste pour avoir le premier message pour le titre/aperçu
        },
      },
    });
  },

  // Récupérer un chat spécifique avec ses messages
  async getChat(chatId: string, userId: string) {
    return prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sources: true,
          },
        },
      },
    });
  },

  // Créer un nouveau chat
  async createChat(data: ChatInput) {
    return prisma.chat.create({
      data,
    });
  },

  // Ajouter un message à un chat
  async addMessage(data: MessageInput) {
    const message = await prisma.message.create({
      data,
    });

    // Mettre à jour la date de mise à jour du chat
    await prisma.chat.update({
      where: { id: data.chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  },

  // Ajouter des sources à un message
  async addSources(sources: SourceInput[]) {
    const createdSources = await Promise.all(
      sources.map((source) =>
        prisma.source.create({
          data: source,
        })
      )
    );
    return createdSources;
  },

  // Supprimer un chat
  async deleteChat(chatId: string, userId: string) {
    return prisma.chat.deleteMany({
      where: { id: chatId, userId },
    });
  },
}; 