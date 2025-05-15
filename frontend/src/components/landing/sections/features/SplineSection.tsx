'use client'

import { SplineScene } from "@/components/ui/spline-scene";
import { Card } from "@/components/ui/card";
import { Spotlight } from "@/components/ui/spotlight";
import { SectionTitle } from "../../../ui/SectionTitle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
 
export function SplineSection() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleConnectClick = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  };

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
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              size="default"
              onClick={handleConnectClick}
            >
              Connecter
            </Button>
            <Button 
              className="text-orange-500 hover:text-orange-600"
              variant="link"
              size="default"
              asChild
            >
              <Link href="#">
                En savoir plus
                <span className="ml-2 flex h-[22px] w-[22px] items-center justify-center">
                  <svg
                    className="text-orange-500 h-4 w-4"
                    fill="none"
                    height="24"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="24"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
} 