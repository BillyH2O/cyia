'use client';

import React, { useState, useEffect } from 'react';
import { ChatInputAcetern } from './ChatInputAcetern';
import ModelSelector from './ModelSelector';
import { useChatContext } from '@/contexts/ChatContext';
import { providerLogoMap } from '@/config/provider-config';
import { AdvancedOptionsSheet } from '@/components/features/terminal/AdvancedOptionsSheet';
import { PlaygroundSettingsButton } from '@/components/features/terminal/PlaygroundSettingsButton';

// Hook simple pour détecter la taille de l'écran (breakpoint mobile)
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    checkScreenSize(); // Vérifier à l'initialisation
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);

  return isMobile;
};

export function ChatFooter() {
  const {
    input,
    isSending,
    availableModels,
    selectedModel,
    isLoadingModels,
    isPlayground,
    setInput,
    sendMessage,
    setSelectedModel,
  } = useChatContext();

  const isMobile = useIsMobile();

  const isDisabled = isSending || !selectedModel;

  return (
    <footer className={`p-4 bg-muted/50 border-t border-border text-foreground shrink-0`}>
      <div className="max-w-3xl mx-auto flex items-center gap-2">
        <div className="flex-grow">
          <ChatInputAcetern
            value={input}
            onValueChange={setInput}
            onSubmit={() => sendMessage()}
            isLoading={isSending}
            isDisabled={isDisabled}
          />
        </div>

        <div className="flex items-center gap-2">
          {!isMobile && (
          <ModelSelector
            availableModels={availableModels}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            isLoading={isSending}
            isLoadingModels={isLoadingModels}
            providerLogoMap={providerLogoMap}
          />
          )}
          {isPlayground 
            ? <PlaygroundSettingsButton isMobile={isMobile} /> 
            : <AdvancedOptionsSheet isMobile={isMobile} />
          }
        </div>
      </div>
    </footer>
  );
} 