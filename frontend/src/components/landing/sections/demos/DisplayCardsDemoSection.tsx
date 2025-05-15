'use client';

import DisplayCards from "@/components/ui/display-cards";
import { type DisplayCardProps } from "@/components/ui/display-cards"; // Import the interface
import { Sparkles, Zap, Target } from "lucide-react";

const cardsForDemo: DisplayCardProps[] = [
  {
    icon: <Sparkles className="size-5 text-amber-400" />,
    title: "Quels sont les frais de scolarité ?",
    description: "Les frais varient selon le statut : 3500€ pour les nationaux et européens",
    date: "CY IA",
    titleClassName: "text-amber-500",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Zap className="size-5 text-rose-400" />,
    title: "Combien de sites possède CY Tech ?",
    description: "CY Tech dispose de 5 campus : Cergy, Pau, Nice-Sophia, Berlin et Pékin",
    date: "CY IA",
    titleClassName: "text-sky-500",
    className:
      "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 grayscale-[100%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: <Target className="size-5 text-sky-400" />,
    title: "Quel est le classement de l'école ?",
    description: "CY Tech est classée dans le top 10 des écoles d'ingénieurs post-bac en France",
    date: "CY IA",
    titleClassName: "text-sky-500",
    className:
      "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
  },
];

export function DisplayCardsDemoSection() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <DisplayCards cards={cardsForDemo} />
    </div>
  );
} 