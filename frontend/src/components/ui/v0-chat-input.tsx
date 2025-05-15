"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Textarea } from "./textarea"; // Correction chemin relatif
import { cn } from "@/lib/utils";
import {
    ImageIcon,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
} from "lucide-react";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

// Hook pour l'auto-redimensionnement
function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }
            textarea.style.height = `${minHeight}px`; // Rétrécir temporairement
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );
            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}


// --- Interface des Props pour l'intégration ---
interface V0ChatInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void; // Changé: plus besoin d'événement
  isLoading: boolean;
  isDisabled: boolean; // Combinaison de isLoading et !selectedModel
}


// --- Renommé et modifié pour l'intégration ---
export function V0ChatInput({
  value,
  onValueChange,
  onSubmit,
  isLoading,
  isDisabled // Utiliser isDisabled
}: V0ChatInputProps) {
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52, // Ajusté la hauteur min
        maxHeight: 200,
    });

    // Effet pour réajuster la hauteur si la valeur est vidée de l'extérieur
    useEffect(() => {
      if (value === '') {
        adjustHeight(true);
      }
    }, [value, adjustHeight]);


    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey && !isDisabled) {
            e.preventDefault();
            if (value.trim()) {
                onSubmit();
            }
        }
    };

    const handleSendClick = () => {
      if (value.trim() && !isDisabled) {
        onSubmit();
      }
    }

    return (
        // Enlever le conteneur externe pour mieux s'intégrer au Footer
        // <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 space-y-8">

            // Remplacer le titre statique
            // <h1 className="text-4xl font-bold text-black dark:text-white">
            //    What can I help you ship?
            // </h1>

            <div className="w-full">
                 {/* --- Adaptation des styles au thème CY Tech --- */}
                <div className={cn(
                    "relative rounded-xl border",
                    isDisabled ? "bg-muted/50 border-border/50" : "bg-background border-border" // Style désactivé/activé
                )}>
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            value={value}
                            onChange={(e) => {
                                onValueChange(e.target.value); // Utiliser la prop
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Message CY Tech AI Assistant..." // Placeholder mis à jour
                            disabled={isDisabled} // Utiliser isDisabled
                            className={cn(
                                "w-full px-4 py-3",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-foreground text-sm", // Utiliser couleur theme
                                "focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-muted-foreground placeholder:text-sm",
                                "min-h-[52px]" // Hauteur min ajustée
                            )}
                            style={{ overflow: "hidden" }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-2 border-t border-border/50"> {/* Padding ajusté, bordure */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={isDisabled} // Désactiver
                                className="group p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Paperclip className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground hidden group-hover:inline transition-opacity">
                                    Attach
                                </span>
                            </button>
                             <button
                                type="button"
                                disabled={isDisabled} // Désactiver
                                className="group p-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <PlusIcon className="w-4 h-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground hidden group-hover:inline transition-opacity">
                                    Project
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                           {/* Enlever le bouton Projet redondant ici */}
                            <button
                                type="button"
                                onClick={handleSendClick} // Ajouter onClick
                                disabled={isDisabled || !value.trim()} // Désactiver si vide ou isDisabled
                                className={cn(
                                    "p-1.5 rounded-lg text-sm transition-colors",
                                    "flex items-center justify-center",
                                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1", // Style focus
                                    (value.trim() && !isDisabled)
                                        ? "bg-[--cy-tech-blue] text-[--cy-tech-blue-foreground] hover:opacity-90" // Style actif (Bleu CY Tech)
                                        : "bg-muted text-muted-foreground cursor-not-allowed" // Style inactif
                                )}
                            >
                                <ArrowUpIcon className="w-4 h-4"/>
                                <span className="sr-only">Send</span>
                            </button>
                        </div>
                    </div>
                </div>
                {/* --- Les ActionButtons peuvent être enlevés si non utilisés pour l'instant --- */}
                {/* <div className="flex items-center justify-center gap-3 mt-4">
                    <ActionButton icon={<ImageIcon className="w-4 h-4" />} label="Clone a Screenshot" />
                    <ActionButton icon={<Figma className="w-4 h-4" />} label="Import from Figma" />
                    <ActionButton icon={<FileUp className="w-4 h-4" />} label="Upload a Project" />
                    <ActionButton icon={<MonitorIcon className="w-4 h-4" />} label="Landing Page" />
                    <ActionButton icon={<CircleUserRound className="w-4 h-4" />} label="Sign Up Form" />
                </div> */}
            </div>
        // </div>
    );
}

// --- ActionButton non modifié, peut être enlevé si non utilisé ---
interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
}

function ActionButton({ icon, label }: ActionButtonProps) {
    return (
        <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full border border-border text-muted-foreground hover:text-foreground transition-colors text-xs"
        >
            {icon}
            <span>{label}</span>
        </button>
    );
} 