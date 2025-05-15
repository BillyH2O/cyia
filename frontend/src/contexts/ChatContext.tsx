'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useChat } from '@/hooks/useChat';
import { Message, Model } from '@/types/chat';

// Définition du type des données du contexte
interface ChatContextType {
  // États du chat
  input: string;
  messages: Message[];
  isSending: boolean;
  isLoadingMessages: boolean;
  evaluateSources: boolean;
  useReranker: boolean;
  useStreaming: boolean;
  useMultiQuery: boolean;
  temperature: number;
  availableModels: Record<string, Model>;
  selectedModel: string;
  isLoadingModels: boolean;
  currentChatId: string | null;
  isChatEmpty: boolean;
  topP: number | null;
  topK: number | null;
  frequencyPenalty: number | null;
  presencePenalty: number | null;
  repetitionPenalty: number | null;
  seed: number | null;
  retrievalK: number | null;
  rerankK: number | null;
  isPlayground: boolean;
  isOptionsVisible: boolean;
  
  // Actions du chat
  setInput: (value: string) => void;
  setEvaluateSources: (value: boolean) => void;
  setUseReranker: (value: boolean) => void;
  setUseStreaming: (value: boolean) => void;
  setUseMultiQuery: (value: boolean) => void;
  setTemperature: (value: number) => void;
  setSelectedModel: (value: string) => void;
  setTopP: (value: number | null) => void;
  setTopK: (value: number | null) => void;
  setFrequencyPenalty: (value: number | null) => void;
  setPresencePenalty: (value: number | null) => void;
  setRepetitionPenalty: (value: number | null) => void;
  setSeed: (value: number | null) => void;
  setRetrievalK: (value: number | null) => void;
  setRerankK: (value: number | null) => void;
  sendMessage: (prompt?: string) => Promise<void>;
  selectChat: (chatId: string | null) => void;
  createNewChat: () => void;
  deleteChat: (chatId: string) => Promise<void>;
  toggleOptionsVisibility: () => void;
}

// Créer le contexte
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider du contexte
export function ChatProvider({ children, chatId }: { children: ReactNode, chatId?: string | null }) {
  const chatHookArgs = chatId === undefined ? undefined : chatId; 
  const chat = useChat(chatHookArgs); 
  
  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

// Hook custom pour utiliser le contexte
export function useChatContext() {
  const context = useContext(ChatContext);
  
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  
  return context;
} 