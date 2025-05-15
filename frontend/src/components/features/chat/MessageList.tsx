'use client';

import React, { RefObject } from 'react';
import { Message } from '@/types/chat';
import {
  UserAvatar,
  BotAvatar,
  MessageBubble,
  LoadingIndicator
} from './message-components';
import { useChatContext } from '@/contexts/ChatContext';
import { providerLogoMap } from '@/config/provider-config';

interface MessageListProps {
  messagesEndRef: RefObject<HTMLDivElement | null>;
  userImage?: string | null;
  userName?: string | null;
  cyTechLogo?: string | null;
}

/**
 * Composant affichant la liste des messages dans une conversation
 */
const MessageList: React.FC<MessageListProps> = ({
  messagesEndRef,
  userImage,
  userName,
  cyTechLogo,
}) => {
  // Utiliser le contexte de chat au lieu des props
  const { messages, isSending, availableModels } = useChatContext();

  // Fonction pour obtenir le logo du modèle
  const getModelLogo = (modelId: string): string | null => {
    if (!availableModels || !modelId || !providerLogoMap) return null;
    
    const model = availableModels[modelId];
    if (!model) return null;
    
    return providerLogoMap[model.provider];
  };

  // Fonction pour obtenir le nom du modèle à partir de son ID
  const getModelName = (modelId: string): string => {
    if (!availableModels || !modelId) return modelId;
    
    const model = availableModels[modelId];
    if (!model) return modelId;
    
    return model.name;
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
      {messages.map((message, index) => {
        const isBot = message.sender === 'bot';
        
        return (
          <div
            key={index}
            className={`flex items-start gap-3 ${
              isBot ? 'justify-start' : 'justify-end'
            }`}
          >
            {isBot && <BotAvatar cyTechLogo={cyTechLogo} />}
            
            <MessageBubble 
              message={message} 
              isBot={isBot} 
              getModelLogo={getModelLogo} 
              getModelName={getModelName} 
            />
            
            {!isBot && <UserAvatar userImage={userImage} userName={userName} />}
          </div>
        );
      })}

      {isSending && !messages.some(msg => msg.isStreaming) && (
        <LoadingIndicator cyTechLogo={cyTechLogo} />
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 