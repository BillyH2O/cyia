'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, Info } from "lucide-react"; 
import { AdvancedOptionsPanel } from "./AdvancedOptionsPanel";

interface AdvancedOptionsSheetProps {
  isMobile?: boolean;
}

export function AdvancedOptionsSheet({ isMobile }: AdvancedOptionsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Advanced Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto p-0 flex flex-col" side="right">
        <SheetHeader className="sr-only">
          <SheetTitle>Paramètres avancés de génération</SheetTitle>
        </SheetHeader>
        
        <AdvancedOptionsPanel isMobile={isMobile} />

        <SheetFooter className="p-6 border-t border-border mt-auto">
          <SheetClose asChild>
            <Button className="w-full">
              Fermer
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
} 