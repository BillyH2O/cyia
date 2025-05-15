import React, { RefObject } from 'react';
import { EmptyChat } from '@/components/features/chat/EmptyChat';
import MessageList from '@/components/features/chat/MessageList';
import { useChatContext } from '@/contexts/ChatContext';

interface ChatProps {
  messagesEndRef: RefObject<HTMLDivElement | null>;
  userImage?: string | null;
  userName?: string | null;
  cyTechLogo?: string;
}

export function Chat({
  messagesEndRef,
  userImage,
  userName,
  cyTechLogo = "/cytech_logo.png"
}: ChatProps) {
  const { isChatEmpty } = useChatContext();
  
  return (
    <>
      {isChatEmpty ? (
        <EmptyChat />
      ) : (
        <div className="flex flex-col flex-grow overflow-hidden">
          <MessageList
            messagesEndRef={messagesEndRef}
            userImage={userImage}
            userName={userName}
            cyTechLogo={cyTechLogo}
          />
        </div>
      )}
    </>
  );
} 