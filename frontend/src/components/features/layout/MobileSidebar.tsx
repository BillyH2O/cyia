import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/components/features/layout/Sidebar';
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function MobileSidebar({ 
  isOpen, 
  setIsOpen
}: MobileSidebarProps) {
  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Fermer la barre latérale" : "Ouvrir la barre latérale"}
        >
          <Menu className="h-6 w-6" />
        </Button>
        <SheetContent side="left" className="p-0 w-[300px] sm:w-[350px]">
          <SheetTitle className="sr-only">Navigation sidebar</SheetTitle>
          <Sidebar isMobileSheet={true} />
        </SheetContent>
      </Sheet>
    </div>
  );
} 