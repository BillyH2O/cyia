import { CytechLogo } from '@/components/ui/CytechLogo';
import React from 'react';
import Link from 'next/link';


interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-screen w-full">
      <Link href="/" className="absolute left-4 top-4 z-10 flex items-center gap-2 cursor-pointer">
        <CytechLogo size={30} />
        <p className="font-medium text-foreground hidden sm:block">CY IA</p>
      </Link>

      <div className="flex w-full flex-col items-center justify-center bg-background p-4 pt-20 lg:w-1/2 min-h-screen">
        <div className="flex w-full max-w-sm flex-col items-center gap-4">
          <div className="w-full text-left">
            <p className="pb-2 text-xl font-medium">{title}</p>
            <p className="text-sm text-default-500">{subtitle}</p>
          </div>

          {children} 
        </div>
      </div>

      <div
        className="hidden lg:flex lg:w-1/2 min-h-screen items-center justify-center relative"
        style={{
          backgroundImage: "url(/cytech_site.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
      </div>
    </div>
  );
} 