import React, { ReactNode, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Sidebar } from '@/components/features/layout/Sidebar';
import { MobileSidebar } from '@/components/features/layout/MobileSidebar';
import { Header } from '@/components/features/layout/Header';
import { Chat } from '@/components/features/chat/Chat';
import { ChatFooter } from '@/components/features/chat/ChatFooter';

export interface DashboardLayoutProps {
  children?: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) { 
  const { data: session, status } = useSession();
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return null; 
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <main className="flex flex-col flex-grow h-screen overflow-hidden">
        <div className="flex items-center border-b shrink-0 h-16">
          <MobileSidebar
            isOpen={isSidebarSheetOpen}
            setIsOpen={setIsSidebarSheetOpen}
          />
          <div className="flex-grow">
            <Header />
          </div>
        </div>

        {children || (
           
          <div className="flex-1 flex flex-col overflow-hidden"> 
            <Chat
              messagesEndRef={messagesEndRef}
              userImage={session?.user?.image}
              userName={session?.user?.name}
              cyTechLogo="/cytech_logo.png" 
            />
            <ChatFooter />
          </div>
        )}
      </main>
    </div>
  );
} 