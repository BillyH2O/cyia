'use client';

import React from 'react';
import Image from 'next/image';
import type { Message, Model, Source } from '@/types/chat'; 

interface ChatMessageProps {
  msg: Message;
  availableModels: Record<string, Model>;
  providerLogoMap: Record<string, string>;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ msg, availableModels, providerLogoMap }) => {
  const modelInfo = msg.model ? availableModels[msg.model] : null;
  const logoSrc = modelInfo?.provider ? providerLogoMap[modelInfo.provider] : null;

  return (
    <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`p-3 rounded-lg max-w-[80%] md:max-w-[70%] shadow-sm bg-amber-500 ${ // max-width pour éviter que ça prenne toute la largeur, shadow-sm léger
          msg.sender === 'user'
            ? 'bg-primary text-primary-foreground' 
            : 'bg-card text-card-foreground' 
        }`}
      >
        {/* Utiliser prose pour un meilleur rendu du markdown si le bot en génère */}
        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-1">
           {/* TODO: Remplacer par un vrai parseur Markdown si nécessaire */}
          <p className="whitespace-pre-wrap">{msg.text}</p>
        </div>

        {msg.sender === 'bot' && msg.sources && msg.sources.length > 0 && (
          <details className="mt-2 text-xs bg-muted/50 p-2 rounded"> 
            <summary className="cursor-pointer font-medium text-muted-foreground">Sources ({msg.sources.length})</summary>
            <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground/80">
              {msg.sources.map((source: Source, srcIndex: number) => (
                <li key={srcIndex}>
                  <strong>{source.metadata?.title || 'Source'}</strong>
                  {source.metadata?.url && (
                    <a href={source.metadata.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">(Link)</a>
                  )}
                  <p className="italic opacity-80 mt-0.5">{source.content.substring(0, 100)}...</p>
                </li>
              ))}
            </ul>
          </details>
        )}
        {msg.sender === 'bot' && msg.evaluation && (
          <details className="mt-2 text-xs bg-muted/50 p-2 rounded">
            <summary className="cursor-pointer font-medium text-muted-foreground">Source Evaluation</summary>
            <p className="whitespace-pre-wrap mt-1 text-muted-foreground/80">{msg.evaluation}</p>
          </details>
        )}

        <div className={`flex items-center text-xs mt-1.5 ${msg.sender === 'user' ? 'text-blue-100/70 justify-end' : 'text-muted-foreground/70 justify-between'}`}>
          {msg.sender === 'bot' && msg.processingTime !== undefined && (
            <p>{msg.processingTime.toFixed(2)}s</p>
          )}
           {/* Toujours afficher le conteneur pour un alignement correct même si une info manque */}
          {msg.sender === 'bot' && (
            <div className="flex items-center space-x-1 ml-auto"> 
              {logoSrc && (
                <Image src={logoSrc} alt={`${modelInfo?.provider || ''} logo`} width={12} height={12} className="h-3 w-3"/>
              )}
              {modelInfo && <span>{modelInfo.name}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage; 