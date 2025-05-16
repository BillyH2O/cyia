'use client';

import React from 'react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Model } from '@/types/chat';

interface ModelSelectorProps {
  availableModels: Record<string, Model>;
  selectedModel: string;
  onModelChange: (value: string) => void;
  isLoading: boolean;
  isLoadingModels: boolean;
  providerLogoMap: Record<string, string>;
}

const customModelOrder: string[] = [
  "mistral/ministral-8b",
  "anthropic/claude-3.7-sonnet",
  "deepseek/deepseek-r1:free",
  "x-ai/grok-3-mini-beta",
  "openai/gpt-4o",
  "openai/gpt-4-turbo",
  "openai/gpt-4.1",
  "google/gemini-2.0-flash-lite-001",
  "qwen/qwen-2.5-7b-instruct",
];

const ModelSelector: React.FC<ModelSelectorProps> = ({
  availableModels,
  selectedModel,
  onModelChange,
  isLoading,
  isLoadingModels,
  providerLogoMap,
}) => {
  // Trier les modèles selon l'ordre personnalisé
  const sortedModelEntries = Object.entries(availableModels).sort(([idA], [idB]) => {
    const indexA = customModelOrder.indexOf(idA);
    const indexB = customModelOrder.indexOf(idB);

    // Si les deux modèles sont dans la liste personnalisée, trier par leur index
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    // Si un seul est dans la liste, celui-ci vient en premier
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    // Sinon, conserver l'ordre original ou trier alphabétiquement
    return idA.localeCompare(idB);
  });

  return (
    <div className="flex items-center shrink-0">
      <Select
        value={selectedModel}
        onValueChange={onModelChange}
        disabled={isLoading || isLoadingModels}
      >
        <SelectTrigger className="h-9 text-xs text-foreground bg-background border border-input">
          <SelectValue placeholder="Select..." />
        </SelectTrigger>
        <SelectContent>
          {isLoadingModels ? (
            <SelectItem value="loading" disabled>
              Chargement...
            </SelectItem>
          ) : (
            sortedModelEntries.map(([id, model]) => ( // Utiliser les entrées triées
              <SelectItem key={id} value={id} title={model.description}>
                <div className="flex items-center space-x-2">
                  {model.provider && providerLogoMap[model.provider] && (
                    <Image
                      src={providerLogoMap[model.provider]}
                      alt={`${model.provider} logo`}
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                  )}
                  <span>{model.name}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ModelSelector; 