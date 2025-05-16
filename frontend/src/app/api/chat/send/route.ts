import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient, Chat, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || "http://localhost:5000/api/chat";

async function generateChatTitle(firstMessage: string): Promise<string> {
  const words = firstMessage.split(' ');
  const title = words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
  return title;
}

interface RagSource {
  content: string;
  metadata: Prisma.JsonValue;
}

interface RagResponse {
  answer?: string;
  model?: string;
  processing_time?: number;
  sources?: RagSource[];
  source_evaluation?: string;
  cost?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const body = await req.json();
    const {
      question,
      model,
      chatId: currentChatId,
      ...restParams
    } = body;

    if (!question || !model) {
      return NextResponse.json(
        { error: "Question et modèle requis" },
        { status: 400 }
      );
    }

    let chatId = currentChatId;
    let chat: Chat | null = null;

    // --- 1. Determine Chat ID (Create new chat if necessary) ---
    if (!chatId) {
      const newTitle = await generateChatTitle(question);
      chat = await prisma.chat.create({
        data: {
          userId: userId,
          title: newTitle, // Generate a title for new chats
        },
      });
      chatId = chat.id;
    } else {
      // Verify existing chat belongs to user
      chat = await prisma.chat.findFirst({
        where: { id: chatId, userId: userId },
      });
      if (!chat) {
        return NextResponse.json(
          { error: "Chat non trouvé ou non autorisé" },
          { status: 404 }
        );
      }
    }

    // --- 2. Save User Message to DB ---
    await prisma.message.create({
      data: {
        chatId: chatId,
        role: "user",
        content: question,
      },
    });

    // --- 3. Call RAG Backend --- 
    console.log(`Proxying request to RAG backend: ${RAG_BACKEND_URL}`);
    const ragRequestBody = {
      ...body, // Forward all parameters from the client
      chatId,  // Ensure chatId is up-to-date (may differ if we created a new chat)
      ...restParams, // Include any extra params not explicitly destructured
    };

    const ragResponse = await fetch(RAG_BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ragRequestBody),
    });

    console.log(`RAG Backend Response Status: ${ragResponse.status}`);

    if (!ragResponse.ok) {
      const errorData = await ragResponse.json().catch(() => ({ error: "Failed to parse RAG error response" }));
      console.error("RAG Backend Error:", errorData);
      // Still save an error message to our DB?
      await prisma.message.create({
          data: {
              chatId: chatId,
              role: 'bot',
              content: `Erreur du backend RAG: ${ragResponse.status} ${ragResponse.statusText}. ${errorData?.error || ''}`,
              model: model
          }
      });
      // Update chat timestamp even on error
      await prisma.chat.update({
          where: { id: chatId },
          data: { updatedAt: new Date() }
      });
      return NextResponse.json(
        { error: `Erreur du backend RAG: ${ragResponse.statusText}`, details: errorData },
        { status: ragResponse.status }
      );
    }

    const ragData: RagResponse = await ragResponse.json();
    console.log("RAG Backend Response Data:", ragData);

    // --- 4. Save Bot Message to DB ---
    const botMessageContent = ragData.answer || "Pas de réponse reçue.";
    const botMessageDb = await prisma.message.create({
      data: {
        chatId: chatId,
        role: "bot",
        content: botMessageContent,
        model: ragData.model || model, // Use model from response if available
        processingTime: ragData.processing_time,
        // Sources need separate handling if they exist
      },
    });

    // --- 4b. Save Sources if they exist ---
    if (ragData.sources && Array.isArray(ragData.sources)) {
      await prisma.source.createMany({
        data: ragData.sources.map((source: RagSource) => ({
          messageId: botMessageDb.id,
          content: source.content || '',
          metadata: source.metadata || {},
        })),
      });
    }

     // --- 5. Update Chat Timestamp --- 
     await prisma.chat.update({
        where: { id: chatId },
        data: { updatedAt: new Date() }
     });

    // --- 6. Return Bot Response (and new chatId if created) ---
    const responsePayload = {
      sender: 'bot',
      text: botMessageContent,
      sources: ragData.sources, 
      evaluation: ragData.source_evaluation,
      processingTime: ragData.processing_time,
      model: ragData.model || model,
      chatId: chatId, // Return the potentially new chatId
      cost: ragData.cost,
      prompt_tokens: ragData.prompt_tokens,
      completion_tokens: ragData.completion_tokens,
      total_tokens: ragData.total_tokens,
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error("Erreur dans /api/chat/send:", error);
    const errorMessage = error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json(
      { error: "Erreur interne du serveur", details: errorMessage },
      { status: 500 }
    );
  }
} 