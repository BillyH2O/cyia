'use client';

import { usePathname } from "next/navigation";
import { BookOpen, Mail } from "lucide-react";
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { UserAccountNav } from "./UserAccountNav"; 

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/playground': 'Playground',
  '/dashboard/analytics': 'Statistiques',
  '/dashboard/contact': 'Contact',
  '/': 'Dashboard', 
};

const DEFAULT_TITLE = 'CY Tech AI Assistant';

const getPageTitle = (pathname: string): string => {
  if (pathname.startsWith('/dashboard/chat/')) {
    return 'Chat';
  }
  return pageTitles[pathname] ?? DEFAULT_TITLE;
};


export function Header() { 
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex items-center justify-between p-4 h-16">
      <div className="flex items-center gap-2">
        <span className="text-xl font-semibold">{title}</span>
      </div>

      <div className="flex items-center gap-4"> 
        <div className="flex items-center gap-2">
          <a 
            href="https://fr.uefa.com/uefachampionsleague/match/2003753--marseille-vs-man-utd/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex"
          >
            <Button variant="ghost" size="icon" className="h-9 w-9" title="Documentation">
              <BookOpen className="h-5 w-5" />
            </Button>
          </a>
          <Link href="/dashboard/contact" passHref>
            <Button variant="ghost" size="icon" className="h-9 w-9" title="Contact" asChild>
              <span><Mail className="h-5 w-5" /></span>
            </Button>
          </Link>
        </div>

        <UserAccountNav /> 
      </div>
    </header>
  );
} 