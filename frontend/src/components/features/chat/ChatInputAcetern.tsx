"use client";

import React from 'react';
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { cn } from "@/lib/utils";

interface ChatInputAceternProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export function ChatInputAcetern({ 
  value,
  onValueChange,
  onSubmit,
  isDisabled
}: ChatInputAceternProps) {
  
  const placeholders = [
    "Quelle est la procédure d'admission ?",
    "Où se trouve le campus de Cergy ?",
    "Quelles sont les spécialités en IA ?",
    "Comment contacter le BDE ?",
    "Quels sont les frais de scolarité ?",
  ];

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="w-full">
      <div className={cn(
          "w-full relative",
          isDisabled ? "bg-muted/50 border-border/50 cursor-not-allowed" : "",
        )}
      >
      <PlaceholdersAndVanishInput
        placeholders={placeholders}
        onChange={handleChange}
        onSubmit={handleSubmit}
        value={value}
      />
      </div>
    </div>
  );
}
