'use client';

import { DisplayCardsDemoSection } from "./DisplayCardsDemoSection";
import { CpuArchitectureDemoSection } from "./CpuArchitectureDemoSection";
import { CardSkeletonContainer, Skeleton } from "@/components/ui/cards-demo-3";
import { SectionTitle } from "./SectionTitle";

export function FeaturesBentoSection() {
  const componentsToRender = [
    <CardSkeletonContainer key="cardskeleton"><Skeleton /></CardSkeletonContainer>,
    <CpuArchitectureDemoSection key="cpu" />,
    <DisplayCardsDemoSection key="cards" />
  ];

  const componentDetails = [
    { 
      title: "Large choix de modèles LLM", 
      description: "GPT, Mistral, Claude, Grok, Gemini – choisissez le modèle qui vous convient le mieux selon votre usage." 
    },
    { 
      title: "Utilisation en local possible", 
      description: "Déployez CY IA en interne pour une confidentialité maximale. Fonctionne avec une base de données PostgreSQL." 
    },
    { 
      title: "Historique intelligent des conversations", 
      description: "Toutes vos discussions sont sauvegardées pour vous offrir un suivi de vos recherches, et une expérience utilisateur optimale." 
    },
  ];

  return (
    <section className="py-12 md:py-24 w-full" id="solutions">
      <div className="container mx-auto px-4">
        <SectionTitle 
          title="Technologie flexible et personnalisable"
          description="CY IA s'adapte à vos besoins et préférences techniques :"
        />
        {/* 
          The BentoGrid here will need to be adapted or used differently 
          if we want each item to be one of these full demo sections.
          The original BentoGrid is for smaller, data-driven items.
          We will use a flex layout for these larger components instead.
        */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8 items-stretch">
          {componentsToRender.map((Component, index) => (
            <div key={index} className="flex-1 w-full md:w-1/3 bg-card rounded-xl shadow-xl overflow-hidden flex flex-col items-center justify-center p-4 border">
              <div className="w-full h-64 md:h-72 bg-muted/30 dark:bg-muted/10 rounded-md border border-border/50 overflow-hidden flex items-center justify-center">
                {Component}
              </div>
              <div className="p-4 text-center">
                <h4 className="text-lg font-semibold text-foreground mt-2 mb-1">
                  {componentDetails[index].title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {componentDetails[index].description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 