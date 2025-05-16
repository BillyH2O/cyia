import { NextRequest } from 'next/server';

const BACKEND_STREAM_URL = process.env.RAG_BACKEND_STREAM_URL || 'http://localhost:5000/api/chat/stream';

export async function POST(req: NextRequest) {
  console.log(`[Next.js Proxy Stream] Attempting to proxy to: ${BACKEND_STREAM_URL}`);
  const body = await req.text();

  const backendResp = await fetch(BACKEND_STREAM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!backendResp.body) {
    return new Response('Backend streaming failed', { status: 502 });
  }

  // Pass-through streaming body
  return new Response(backendResp.body, {
    status: backendResp.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
} 