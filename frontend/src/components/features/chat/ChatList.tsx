import React, { useState, useCallback, useEffect } from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatItem } from './ChatItem';
import { useChatContext } from '@/contexts/ChatContext';

interface Chat {
  id: string;
  title: string | null;
  updatedAt: string;
}

export function ChatList() {
  const { currentChatId } = useChatContext();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Récupération des chats depuis l'API
  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/chats');
      if (!response.ok) {
        throw new Error(`Failed to fetch chats (Status: ${response.status})`);
      }
      const data = await response.json();
      setChats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error("Fetch chats error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les chats au montage et quand currentChatId change
  useEffect(() => {
    fetchChats();
  }, [fetchChats, currentChatId]);

  return (
    <ScrollArea className="flex-grow max-w-[340px] max-h-[95vh] overflow-y-auto p-3">
      {isLoading && <p className="text-muted-foreground text-sm p-2">Chargement...</p>}
      {error && <p className="text-destructive text-sm p-2">Erreur: {error}</p>}
      {!isLoading && !error && chats.length === 0 && (
        <p className="text-muted-foreground text-sm p-2">Aucun chat trouvé.</p>
      )}
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
          />
        ))}
    </ScrollArea>
  );
} 