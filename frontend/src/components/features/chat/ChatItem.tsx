import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';
import { useChatContext } from '@/contexts/ChatContext';

interface Chat {
  id: string;
  title: string | null;
  updatedAt: string;
}

interface ChatItemProps {
  chat: Chat;
}

export function ChatItem({ chat }: ChatItemProps) {
  const { currentChatId, selectChat, deleteChat } = useChatContext();
  const isSelected = currentChatId === chat.id;

  const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (confirm("Êtes-vous sûr de vouloir supprimer cette conversation ?")) {
      deleteChat(chat.id);
    }
  };

  return (
    <div
      className={`flex items-center w-full rounded-md py-2
        transition-colors duration-150
        hover:bg-accent hover:text-accent-foreground
        ${isSelected ? 'bg-black/5 text-secondary-foreground' : ''}`}
    >
      <span
        className="truncate max-w-[230px] mr-auto cursor-pointer pl-2"
        onClick={() => selectChat(chat.id)}
        title={chat.title || `Chat du ${new Date(chat.updatedAt).toLocaleDateString()}`}
      >
        {chat.title || "Chat sans titre"}
      </span>
      
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 hover:bg-transparent [&>svg]:hover:text-destructive"
        onClick={handleDelete}
        aria-label="Supprimer"
      >
        <Trash2 className="h-4 w-4 text-muted-foreground transition-colors" />
      </Button>
    </div>
  );
} 