"use client";

import * as React from "react";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Icon } from "@iconify/react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "framer-motion";
import { AppScreenshotSkewed } from "./AppScreenshotSkewed";  
import FadeInImage from "../../../ui/FadeInImage";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export const HeroSection = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const handleDiscoverClick = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  };

  return (
    <div className="relative flex min-h-[80vh] sm:min-h-[95vh] w-full flex-col overflow-hidden ">
      <main className="container mx-auto mt-[60px] flex max-w-[1024px] flex-col items-start px-8">
        <section className="z-20 flex flex-col items-start justify-center gap-[18px] sm:gap-6">
          <Button
            className="h-9 overflow-hidden border border-gray-200 bg-gray-50 px-[18px] py-2 text-sm font-normal leading-5 text-gray-500 rounded-full hover:bg-gray-50 hover:border-gray-200 hover:text-gray-500 hover:no-underline"
            asChild
          >
            <Link href="#" className="hover:no-underline">
              Propulsé par l&apos;IA
              <Icon
                className="ml-2 flex-none"
                icon="solar:arrow-right-linear"
                width={20}
              />
            </Link>
          </Button>
          <LazyMotion features={domAnimation}>
            <m.div
              animate="kick"
              className="flex flex-col gap-2"
              exit="auto"
              initial="auto"
              transition={{
                duration: 0.25,
                ease: "easeInOut",
              }}
              variants={{
                auto: { width: "auto" },
                kick: { width: "auto" },
              }}
            >
              <AnimatePresence mode="wait">
                <m.div
                  key="hero-section-title"
                  animate={{ filter: "blur(0px)", opacity: 1, x: 0 }}
                  className="text-start font-semibold leading-[1.2] tracking-tighter text-4xl md:text-5xl lg:text-6xl"
                  initial={{ filter: "blur(16px)", opacity: 0, x: 15 + 1 * 2 }}
                  transition={{
                    bounce: 0,
                    delay: 0.01 * 10,
                    duration: 0.8 + 0.1 * 8,
                    type: "spring",
                  }}
                >
                  Votre assistant intelligent pour CY Tech
                </m.div>

                <m.div
                  key="hero-section-description"
                  animate={{ filter: "blur(0px)", opacity: 1, x: 0 }}
                  className="text-start font-normal text-base sm:text-lg md:text-xl my-8 text-gray-600 max-w-2xl"
                  initial={{ filter: "blur(16px)", opacity: 0, x: 15 + 1 * 3 }}
                  transition={{
                    bounce: 0,
                    delay: 0.01 * 30,
                    duration: 0.8 + 0.1 * 9,
                    type: "spring",
                  }}
                >
                  Un assistant IA complet qui exploite les données du site CY Tech et vos emails pour vous offrir une expérience personnalisée. Découvrez le RAG sur site, RAG Mail, Playground avancé et suivez vos statistiques d&apos;utilisation.
                </m.div>

                <m.div
                  key="hero-section-buttons"
                  animate={{ filter: "blur(0px)", opacity: 1, x: 0 }}
                  className="flex gap-3 flex-row items-center sm:gap-6"
                  initial={{ filter: "blur(16px)", opacity: 0, x: 15 + 1 * 4 }}
                  transition={{
                    bounce: 0,
                    delay: 0.01 * 50,
                    duration: 0.8 + 0.1 * 10,
                    type: "spring",
                  }}
                >
                  <Button
                    className="bg-primary hover:bg-blue-700 text-white font-medium w-28"
                    size="sm"
                    onClick={handleDiscoverClick}
                  >
                    Découvrir
                  </Button>
                  <Button
                    className="text-orange-500 hover:text-orange-600"
                    variant="link"
                    size="default"
                    asChild
                  >
                    <a 
                      href="https://github.com/BillyH2O/cyia/blob/main/rapport-cyia.pdf"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      En savoir plus
                      <span className="ml-2 flex h-[22px] w-[22px] items-center justify-center">
                        <Icon
                          className="text-orange-500"
                          icon="solar:arrow-right-linear"
                          width={16}
                        />
                      </span>
                    </a>
                  </Button>
                </m.div>
              </AnimatePresence>
            </m.div>
          </LazyMotion>
        </section>
      </main>
      <LazyMotion features={domAnimation}>
        <AnimatePresence mode="wait">
          <m.div
            key="hero-section-app-screenshot"
            animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
            className="relative mt-8 md:absolute md:top-[50%] md:mt-0 w-full"
            initial={{ filter: "blur(16px)", opacity: 0, y: 300 }}
            transition={{
              bounce: 0,
              delay: 0.01 * 10,
              duration: 0.8 + 0.1 * 8,
              type: "spring",
            }}
          >
            <AppScreenshotSkewed className="w-full" />
          </m.div>
        </AnimatePresence>
      </LazyMotion>

      <div className="pointer-events-none absolute inset-0 z-10 select-none opacity-30">
        <FadeInImage
          alt="Gradient background"
          className="h-full w-full object-cover"
          src="https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/backgrounds/bg-gradient.png"
        />
      </div>
    </div>
  );
}; 