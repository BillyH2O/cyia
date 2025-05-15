'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { NavButton, icons } from '@/components/features/layout/NavButton';
import { NewChatButton } from '@/components/features/chat/NewChatButton';
import { useChatContext } from '@/contexts/ChatContext';
import Link from 'next/link';

export interface NavItem {
  id: string;
  label: string;
  path: string | string[]; 
  icon: keyof typeof icons;
  exact?: boolean; 
  condition?: () => boolean; 
  isNewChat?: boolean; 
  hideWhenCollapsed?: boolean; 
}

interface SidebarNavigationProps {
  isOpen: boolean;
  isMobileSheet: boolean;
}

export const navigationItems: NavItem[] = [
  {
    id: 'home',
    label: 'Accueil',
    path: '/dashboard',
    icon: 'Home',
    exact: true,
  },
  {
    id: 'playground',
    label: 'Playground',
    path: '/dashboard/playground',
    icon: 'FlaskConical',
  },
  {
    id: 'analytics',
    label: 'Statistiques',
    path: '/dashboard/analytics',
    icon: 'BarChart3',
    exact: true,
  },
  {
    id: 'rag-mail',
    label: 'RAG Mail',
    path: 'https://github.com/YvanLmb/CYIA',
    icon: 'Mail',
  },
  {
    id: 'landing',
    label: 'En savoir plus',
    path: '/',
    icon: 'Info',
    exact: true,
  },
];

export const homePageSpecificItems = (createNewChat: () => void): NavItem[] => [
  {
    id: 'new-chat',
    label: 'Nouveau Chat',
    path: '/', 
    icon: 'Home', 
    isNewChat: true,
    condition: () => {
      const pathname = usePathname();
      return pathname === '/dashboard';
    },
    hideWhenCollapsed: false, 
  },
];

export function SidebarNavigation({ isOpen, isMobileSheet }: SidebarNavigationProps) {
  const pathname = usePathname();
  const { createNewChat } = useChatContext();
  const isHomePage = pathname === '/dashboard';
  const showTextInSidebar = isOpen || isMobileSheet;

  const isActive = (item: NavItem) => {
    if (typeof item.path === 'string') {
      return item.exact ? pathname === item.path : pathname.startsWith(item.path);
    }
    return item.path.some(p => item.exact ? pathname === p : pathname.startsWith(p));
  };

  const regularItems = navigationItems.filter(item => !((item.hideWhenCollapsed && !isOpen) && !isMobileSheet) );
  const newChatButton = homePageSpecificItems(createNewChat).find(item => 
    item.isNewChat && 
    (!item.condition || item.condition()) && 
    !((item.hideWhenCollapsed && !isOpen) && !isMobileSheet)
  );

  return (
    <div className={`p-2 space-y-2 ${showTextInSidebar ? 'border-b' : 'flex flex-col items-center mt-4'}`}>

            
      {regularItems.map((item) => {
        const active = isActive(item);
        const widthClass = showTextInSidebar ? 'w-full justify-start' : 'w-10 h-10';
        const variant = "default";
        const itemClassName = `${widthClass} ${
          active 
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
            : 'bg-black/85 hover:bg-black text-white'
        }`;
        
        return (
          <NavButton
            key={item.id}
            variant={variant}
            className={itemClassName}
            showText={showTextInSidebar}
            href={typeof item.path === 'string' ? item.path : item.path[0]}
            icon={icons[item.icon]}
            label={item.label}
          />
        );
      })}

      {showTextInSidebar && newChatButton && (
        <>
          <div className="border-t border-border my-2"></div>
          <NewChatButton
            key={newChatButton.id}
            onClick={createNewChat}
            variant={'default'} 
            className={`w-full justify-center bg-orange-500 hover:bg-orange-600 text-white`}
            showText={true} 
          />
        </>
      )}

      {!showTextInSidebar && newChatButton && (
        <NewChatButton
          key={`${newChatButton.id}-collapsed`}
          onClick={createNewChat}
          variant={'default'} 
          className={`w-10 h-10 bg-orange-500 hover:bg-orange-600 text-white`}
          showText={false}
        />
      )}
    </div>
  );
} 