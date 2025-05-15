import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/types/chat';
import ModelInfo from './ModelInfo';
import SourcesList from './SourcesList';
import Evaluation from './Evaluation';

export interface MessageBubbleProps {
  message: Message;
  isBot: boolean;
  getModelLogo: (modelId: string) => string | null;
  getModelName: (modelId: string) => string;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isBot, 
  getModelLogo, 
  getModelName 
}) => (
  <div
    className={`rounded-lg p-3 max-w-[75%] shadow-sm prose prose-sm dark:prose-invert break-words ${
      !isBot
        ? 'bg-primary text-primary-foreground prose-p:text-primary-foreground prose-li:text-primary-foreground prose-strong:text-primary-foreground prose-code:text-primary-foreground'
        : 'bg-card text-card-foreground border'
    } ${message.isStreaming ? 'animate-pulse-subtle' : ''}`}
  >
    <ReactMarkdown>{message.text}</ReactMarkdown>

    {/* Indicateur de streaming actif */}
    {isBot && message.isStreaming && (
      <div className="w-full flex justify-center mt-2">
        <div className="flex space-x-1 animate-pulse">
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animation-delay-200"></div>
          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animation-delay-400"></div>
        </div>
      </div>
    )}

    {isBot && message.model && (
      <ModelInfo 
        model={message.model} 
        processingTime={message.processingTime} 
        getModelLogo={getModelLogo} 
        getModelName={getModelName}
      />
    )}

    {isBot && message.sources && message.sources.length > 0 && (
      <SourcesList sources={message.sources} />
    )}

    {isBot && message.evaluation && (
      <Evaluation evaluation={message.evaluation} />
    )}
  </div>
);

export default MessageBubble; 