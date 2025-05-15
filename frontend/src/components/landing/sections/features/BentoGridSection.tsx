'use client'

import { BentoGrid, type BentoItem } from "@/components/ui/bento-grid";
import {
    Globe,
    Cpu,
    Mail,
    BarChart2,
} from "lucide-react";
import { SectionTitle } from "../../../ui/SectionTitle";

const itemsForBento: BentoItem[] = [
    {
        title: "📚 RAG Site Web CY Tech",
        meta: "Recherche sémantique",
        description:
            "Posez vos questions directement à l'IA et obtenez des réponses précises issues du site officiel de CY Tech (nombreuses pages analysées automatiquement). Fini les recherches manuelles !",
        icon: <Globe className="w-5 h-5 text-blue-500" />,
        status: "Live",
        tags: ["Documentation", "Recherche", "IA"],
        colSpan: 2,
        hasPersistentHover: true,
    },
    {
        title: "✉️ RAG Mail Étudiant",
        meta: "Connectez votre messagerie",
        description: "Connectez votre adresse mail de l'école et discutez avec votre messagerie ! Accédez instantanément aux infos importantes : dates, pièces jointes, contacts, etc.",
        icon: <Mail className="w-5 h-5 text-emerald-500" />,
        status: "Active",
        tags: ["Email", "IA", "Recherche"],
    },
    {
        title: "🧪 Playground IA",
        meta: "Personnalisation avancée",
        description: "Testez et optimisez votre expérience : ajustez les hyperparamètres du modèle (température, top-k, etc.), activez le reranking, testez la recherche hybride, et comparez différents LLM.",
        icon: <Cpu className="w-5 h-5 text-purple-500" />,
        tags: ["LLM", "Paramètres", "Optimisation"],
        colSpan: 2,
    },
    {
        title: "📊 Statistiques personnalisées",
        meta: "Suivi d'activité",
        description: "Suivez votre activité sur CY IA : nombre de questions posées, modèles utilisés, temps gagné, sujets les plus abordés, etc.",
        icon: <BarChart2 className="w-5 h-5 text-sky-500" />,
        status: "Live",
        tags: ["Analytics", "Insights", "Dashboard"],
    },
];

export function BentoGridSection() {
    return (
        <section className="py-12 md:py-24 w-full" id="features">
            <div className="container mx-auto px-4">
                <SectionTitle 
                    title="Des fonctionnalités puissantes, organisées de façon intuitive"
                    description="Découvrez comment notre suite d'outils intégrés peut améliorer votre expérience CY Tech au quotidien."
                />
                <BentoGrid items={itemsForBento} />
            </div>
        </section>
    );
} 