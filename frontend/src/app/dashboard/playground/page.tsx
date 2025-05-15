"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import { DashboardLayout } from "@/components/features/layout/DashboardLayout";
import { AdvancedOptionsPanel } from "@/components/features/terminal/AdvancedOptionsPanel";
import { Chat } from "@/components/features/chat/Chat";
import { ChatFooter } from "@/components/features/chat/ChatFooter";

// Hook useIsMobile (copié depuis ChatFooter.tsx pour l'exemple, idéalement à externaliser)
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return; // S'assurer que window est défini (côté client)
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [breakpoint]);
  return isMobile;
};

// Playground-specific main content (chat + options panel)
function PlaygroundMainContent() {
  const { messages, isOptionsVisible } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Chat Area */}
      <main
        className={`flex-1 flex flex-col overflow-hidden ${
          (isOptionsVisible && !isMobile) ? "" : "mr-0"
        }`}
      >
        <Chat
          messagesEndRef={messagesEndRef}
          userImage={null}
          userName={null}
        />
        <ChatFooter />
      </main>

      {/* Advanced Options Panel (Desktop - affiché si options visibles ET PAS mobile) */}
      {isOptionsVisible && !isMobile && (
        <aside className="w-[350px] lg:w-[400px] border-l border-border flex-flex-col overflow-y-auto">
          <AdvancedOptionsPanel isMobile={false} />
        </aside>
      )}
    </div>
  );
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatProvider chatId={null}>
        <DashboardLayout>
          <PlaygroundMainContent />
        </DashboardLayout>
      </ChatProvider>
    </Suspense>
  );
} 