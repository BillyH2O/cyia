'use client';

import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { useChatContext } from "@/contexts/ChatContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { AdvancedOptionsPanel } from "./AdvancedOptionsPanel";

interface PlaygroundSettingsButtonProps {
  isMobile?: boolean;
}

export function PlaygroundSettingsButton({ isMobile }: PlaygroundSettingsButtonProps) {
  const { toggleOptionsVisibility, isOptionsVisible } = useChatContext();

  if (!isMobile) {
    return (
      <Button 
        variant="ghost" 
        size="icon" 
        aria-label="Toggle Advanced Settings"
        onClick={toggleOptionsVisibility}
      >
        <Settings className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Playground Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[90vw] sm:w-[540px] overflow-y-auto p-0 flex flex-col" side="right">
        <SheetHeader className="sr-only">
          <SheetTitle>Paramètres du Playground</SheetTitle>
        </SheetHeader>
        
        <AdvancedOptionsPanel isMobile={isMobile} />

        <SheetFooter className={`p-6 border-t border-border mt-auto ${isMobile ? 'p-3' : ''}`}>
          <SheetClose asChild>
            <Button className={`w-full ${isMobile ? 'h-9 text-sm' : ''}`}>
              Fermer
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 