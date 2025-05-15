"use client";

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChatList } from '@/components/features/chat/ChatList';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavigation } from './SidebarNavigation';

interface SidebarProps {
  isMobileSheet?: boolean;
}

export function Sidebar({ isMobileSheet = false }: SidebarProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(!isMobileSheet);
  const pathname = usePathname();
  const isHomePage = pathname === '/dashboard';

  // Manage open/closed state on desktop based on window width
  useEffect(() => {
    if (!isMobileSheet) {
      const checkDesktop = () => {
        setInternalIsOpen(window.innerWidth >= 1024); // lg breakpoint
      };
      checkDesktop(); // Initial check
      window.addEventListener('resize', checkDesktop);
      return () => window.removeEventListener('resize', checkDesktop);
    }
  }, [isMobileSheet]);

  const toggleSidebar = () => setInternalIsOpen(!internalIsOpen);

  const baseClasses = "flex h-screen flex-col bg-muted/40";
  const dynamicClasses = isMobileSheet
    ? "w-full"
    : `border-r transition-all duration-300 ease-in-out relative ${internalIsOpen ? 'w-64 sm:w-72' : 'w-16'}`;

  return (
    <div className={`${baseClasses} ${dynamicClasses}`}>
      <SidebarHeader 
        isMobileSheet={isMobileSheet} 
        isOpen={internalIsOpen} 
        toggleSidebar={toggleSidebar} 
      />

      <div className={`flex-grow overflow-y-auto overflow-x-hidden ${!internalIsOpen && !isMobileSheet ? 'hidden' : 'flex flex-col'}`}>
        <SidebarNavigation isOpen={internalIsOpen} isMobileSheet={isMobileSheet} />
        
        {isHomePage && (internalIsOpen || isMobileSheet) && <ChatList />} 
      </div>

      {!isMobileSheet && !internalIsOpen && (
         <SidebarNavigation isOpen={false} isMobileSheet={false} />
      )}
    </div>
  );
} 