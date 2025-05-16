import React from 'react';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { CytechLogo } from '@/components/ui/CytechLogo';

interface SidebarHeaderProps {
  isMobileSheet: boolean;
  isOpen: boolean;
  toggleSidebar: () => void;
}

export function SidebarHeader({ isMobileSheet, isOpen, toggleSidebar }: SidebarHeaderProps) {
  if (isMobileSheet) {
    return (
      <SheetHeader className="p-4 border-b">
        <SheetTitle>Historique des Chats</SheetTitle>
      </SheetHeader>
    );
  }

  return (
    <div className={`p-4 border-b h-16 flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
      {isOpen && (
        <div className="flex items-center gap-2">
          <CytechLogo size={30} />
          <span className="text-xl font-semibold">CY IA</span>
        </div>
      )}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        aria-label={isOpen ? "Masquer la barre latérale" : "Afficher la barre latérale"}
      >
        {isOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
      </Button>
    </div>
  );
} 