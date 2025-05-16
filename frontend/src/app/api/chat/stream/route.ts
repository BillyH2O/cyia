import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { PrismaClient, Chat } from '@prisma/client';

const prisma = new PrismaClient();
const BACKEND_STREAM_URL = process.env.RAG_BACKEND_STREAM_URL || 'http://localhost:5000/api/chat/stream';

export async function POST(req: NextRequest) {
  // 1. Auth
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), { status: 401 });
  }

  // 2. Parse payload JSON
  const jsonPayload = await req.json();
  const { question, model, chatId: currentChatId, ...rest } = jsonPayload;
  if (!question || !model) {
    return new Response(JSON.stringify({ error: 'Question et modèle requis' }), { status: 400 });
  }

  // 3. Chat handling (create if necessary)
  let chatId: string = currentChatId;
  if (!chatId) {
    const title = question.split(' ').slice(0, 5).join(' ') + (question.split(' ').length > 5 ? '...' : '');
    const chat = await prisma.chat.create({ data: { userId: session.user.id, title } });
    chatId = chat.id;
  } else {
    const chat = await prisma.chat.findFirst({ where: { id: chatId, userId: session.user.id } });
    if (!chat) {
      return new Response(JSON.stringify({ error: 'Chat non trouvé ou non autorisé' }), { status: 404 });
    }
  }

  // 4. Save user message
  await prisma.message.create({ data: { chatId, role: 'user', content: question } });

  // 5. Proxy stream to backend
  const backendResp = await fetch(BACKEND_STREAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, model, chatId, ...rest }),
  });

  if (!backendResp.body) {
    return new Response('Backend streaming failed', { status: 502 });
  }

  const { readable, writable } = new TransformStream();
  const reader = backendResp.body.getReader();
  const writer = writable.getWriter();

  (async () => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) await writer.write(value);
      }
    } finally {
      await writer.close();
      await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
} 