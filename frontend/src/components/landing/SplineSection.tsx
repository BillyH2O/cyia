'use client'

import { SplineScene } from "@/components/ui/spline-scene";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { SectionTitle } from "./SectionTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
 
export function SplineSection() {
  return (
    <section className="py-12 md:py-24 w-full">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-8 md:gap-12">
        <div className="w-full md:w-1/2">
          <Card className="w-full h-[400px] md:h-[500px] bg-black/[0.96] relative overflow-hidden">
            <Spotlight
              className="-top-40 left-0 md:left-30 md:-top-20"
              fill="white"
            />
            <div className="relative h-full w-full">
              <SplineScene 
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="!w-full !h-full absolute top-0 left-0"
              />
            </div>
          </Card>
        </div>

        <div className="w-full md:w-1/2 flex flex-col items-center text-center">
          <SectionTitle 
            title="Une expérience IA complète"
            description="Posez votre première question."
          />
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium" asChild>
              <Link href="/auth/signin">Connecter</Link>
            </Button>
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50 hover:text-blue-700">
              En savoir plus
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
} 