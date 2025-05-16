import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import { PrismaClient, Chat, Prisma } from "@prisma/client";

const prisma = new PrismaClient();
const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || "http://localhost:5000/api/chat";

async function generateChatTitle(firstMessage: string): Promise<string> {
  const words = firstMessage.split(" ");
  const title = words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");
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
  console.log(`[Next.js Proxy Send] Attempting to proxy to: ${RAG_BACKEND_URL}`);
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    console.log("No session or user ID found");
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const userId = session.user.id;
  console.log("User ID:", userId);

  try {
    const body = await req.json();
    const { question, model, chatId: currentChatId, ...restParams } = body;

    console.log("Request body:", { question, model, currentChatId });

    if (!question || !model) {
      return NextResponse.json(
        { error: "Question et modèle requis" },
        { status: 400 }
      );
    }

    let chatId: string | null = currentChatId || null;
    let chat: Chat | null = null;

    // --- 1. Déterminer le Chat ID (création si nécessaire) ---
    if (!chatId) {
      console.log("Creating new chat...");
      const newTitle = await generateChatTitle(question);
      try {
        chat = await prisma.chat.create({
          data: {
            userId,
            title: newTitle,
          },
        });
        chatId = chat.id;
        console.log("New chat created:", chat);
      } catch (err) {
        console.error("Error creating chat:", err);
        throw err;
      }
    } else {
      console.log("Verifying existing chat...");
      try {
        chat = await prisma.chat.findFirst({
          where: { id: chatId, userId },
        });
        console.log("Found existing chat:", chat);
      } catch (err) {
        console.error("Error finding chat:", err);
        throw err;
      }
      if (!chat) {
        return NextResponse.json(
          { error: "Chat non trouvé ou non autorisé" },
          { status: 404 }
        );
      }
    }

    // --- 2. Sauvegarder le message utilisateur ---
    console.log("Saving user message...");
    try {
      await prisma.message.create({
        data: {
          chatId: chatId!,
          role: "user",
          content: question,
        },
      });
      console.log("User message saved successfully");
    } catch (err) {
      console.error("Error saving user message:", err);
      throw err;
    }

    // --- 3. Appel au backend RAG ---
    console.log(`Proxying request to RAG backend: ${RAG_BACKEND_URL}`);
    const ragRequestBody = {
      ...body,
      chatId, // S'assurer que chatId est transmis
      ...restParams,
    };

    const ragResponse = await fetch(RAG_BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ragRequestBody),
    });

    console.log(`RAG Backend Response Status: ${ragResponse.status}`);

    if (!ragResponse.ok) {
      const errorData = await ragResponse
        .json()
        .catch(() => ({ error: "Failed to parse RAG error response" }));
      console.error("RAG Backend Error:", errorData);

      await prisma.message.create({
        data: {
          chatId: chatId!,
          role: "bot",
          content: `Erreur du backend RAG: ${ragResponse.status} ${ragResponse.statusText}. ${errorData?.error || ""}`,
          model,
        },
      });

      await prisma.chat.update({
        where: { id: chatId! },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json(
        { error: `Erreur du backend RAG: ${ragResponse.statusText}`, details: errorData },
        { status: ragResponse.status }
      );
    }

    const ragData: RagResponse = await ragResponse.json();
    console.log("RAG Backend Response Data:", ragData);

    // --- 4. Sauvegarder le message bot ---
    const botMessageContent = ragData.answer || "Pas de réponse reçue.";
    const botMessageDb = await prisma.message.create({
      data: {
        chatId: chatId!,
        role: "bot",
        content: botMessageContent,
        model: ragData.model || model,
        processingTime: ragData.processing_time,
      },
    });
    console.log("Bot message saved:", botMessageDb);

    // --- 4b. Sauvegarder les sources si elles existent ---
    if (ragData.sources && Array.isArray(ragData.sources)) {
      await prisma.source.createMany({
        data: ragData.sources.map((source) => ({
          messageId: botMessageDb.id,
          content: source.content || "",
          metadata: source.metadata || {},
        })),
      });
      console.log("Sources saved successfully");
    }

    // --- 5. Mettre à jour le timestamp du chat ---
    await prisma.chat.update({
      where: { id: chatId! },
      data: { updatedAt: new Date() },
    });
    console.log("Chat timestamp updated successfully");

    // --- 6. Retourner la réponse ---
    const responsePayload = {
      sender: "bot",
      text: botMessageContent,
      sources: ragData.sources,
      evaluation: ragData.source_evaluation,
      processingTime: ragData.processing_time,
      model: ragData.model || model,
      chatId,
      cost: ragData.cost,
      prompt_tokens: ragData.prompt_tokens,
      completion_tokens: ragData.completion_tokens,
      total_tokens: ragData.total_tokens,
    };

    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error("Erreur dans /api/chat/send:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json(
      { error: "Erreur interne du serveur", details: errorMessage },
      { status: 500 }
    );
  }
} 