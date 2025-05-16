'use client';

import React, { RefObject } from 'react';
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


const MessageList: React.FC<MessageListProps> = ({
  messagesEndRef,
  userImage,
  userName,
  cyTechLogo,
}) => {
  const { messages, isSending, availableModels } = useChatContext();

  const getModelLogo = (modelId: string): string | null => {
    if (!availableModels || !modelId || !providerLogoMap) return null;
    
    const model = availableModels[modelId];
    if (!model) return null;
    
    return providerLogoMap[model.provider];
  };

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