"use client";

import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LogOut, Settings, User as UserIcon, PlayCircle, HelpCircle, 
  BookOpen, Mail
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from '@/components/ui/switch';
import { useChatContext } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';

export default function ChatHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/analytics') return 'Statistiques d\'Utilisation';
    if (pathname.includes('/rag-mail')) return 'RAG Mail';
    if (pathname.includes('/playground')) return 'Playground';
    return 'CY Tech AI Assistant'; // Fallback
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    const names = name.split(" ");
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (
      names[0].charAt(0).toUpperCase() +
      names[names.length - 1].charAt(0).toUpperCase()
    );
  };

  return (
    <header className="flex items-center justify-between h-16 p-3">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => console.log('Doc clicked')} title="Documentation">
          <BookOpen className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => console.log('Contact clicked')} title="Contact">
          <Mail className="h-5 w-5" />
        </Button>

        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage
                  src={session.user.image ?? undefined}
                  alt={session.user.name ?? "Utilisateur"}
                />
                <AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                Mon Compte ({session.user.name || session.user.email})
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <UserIcon className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
} 