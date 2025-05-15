import React from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';

interface NewChatButtonProps {
  onClick: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary" | "destructive" | "link";
  showText?: boolean;
}

export function NewChatButton({ 
  onClick, 
  className = "w-full justify-start bg-orange-500 hover:bg-orange-600 text-white",
  variant = "default",
  showText = true 
}: NewChatButtonProps) {
  return (
    <Button 
      onClick={onClick} 
      className={className}
      variant={variant}
      size={showText ? "default" : "icon"}
    >
      <PlusCircle className={showText ? "mr-2 h-4 w-4" : "h-5 w-5"} />
      {showText && "Nouveau Chat"}
    </Button>
  );
} 