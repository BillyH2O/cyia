'use client';

import React from 'react';
import { SectionTitle } from "./SectionTitle";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FaqItem {
  question: string;
  answer: string;
  value: string;
}

const faqData: FaqItem[] = [
  {
    question: "Qu'est-ce que CY IA ?",
    answer: "CY IA est un assistant intelligent conçu pour aider les étudiants et le personnel de CY Tech à accéder rapidement aux informations de l'université, à gérer leurs emails et à explorer les capacités des grands modèles de langage (LLM).",
    value: "item-1",
  },
  {
    question: "Comment fonctionne la recherche sur le site web de CY Tech ?",
    answer: "Notre fonctionnalité RAG (Retrieval Augmented Generation) analyse le contenu du site officiel de CY Tech pour fournir des réponses précises et contextuelles à vos questions.",
    value: "item-2",
  },
  {
    question: "Puis-je connecter mon email étudiant ?",
    answer: "Oui, la fonctionnalité RAG Mail vous permet de connecter votre messagerie étudiante pour rechercher des informations spécifiques dans vos emails, comme des dates importantes, des pièces jointes ou des contacts.",
    value: "item-3",
  },
  {
    question: "Qu'est-ce que le Playground IA ?",
    answer: "Le Playground IA est un espace où vous pouvez expérimenter avec différents modèles LLM (comme GPT, Claude, Mistral), ajuster leurs paramètres (température, top-k), et tester des fonctionnalités avancées comme le reranking et la recherche hybride.",
    value: "item-4",
  },
  {
    question: "CY IA est-il gratuit ?",
    answer: "Oui, CY IA est un service fourni par l'université et est gratuit pour tous les étudiants et le personnel de CY Tech.",
    value: "item-5",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Nous prenons la sécurité et la confidentialité de vos données très au sérieux. L'option d'utilisation en local avec une base de données PostgreSQL est disponible pour une confidentialité maximale. Toutes les interactions sont protégées.",
    value: "item-6",
  },
];

export function FaqSection() {
  return (
    <section className="py-12 md:py-24 bg-background dark w-full" id="faq">
      <div className="container mx-auto px-4">
        <SectionTitle
          title="Questions Fréquemment Posées"
          description=""
        />
        <div className="max-w-3xl mx-auto mt-8">
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((item) => (
              <AccordionItem key={item.value} value={item.value} className="border-b border-border/50">
                <AccordionTrigger className="text-left hover:no-underline py-4 text-base font-medium text-foreground">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pt-1 pb-4 text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
} 