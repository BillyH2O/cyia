import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LucideIcon, Home, Mail, FlaskConical, BarChart3, Info } from 'lucide-react';

export const icons = {
  Home,
  Mail,
  FlaskConical,
  BarChart3,
  Info
};

interface NavButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  showText?: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export function NavButton({ 
  className, 
  variant = "default", 
  showText = true,
  href,
  icon: Icon,
  label,
  ...props
}: NavButtonProps) {
  const isExternal = href.startsWith('http');
  
  return (
    <Button
      variant={variant}
      className={`flex gap-2 items-center w-full ${className || ''}`}
      asChild
      {...props}
    >
      <Link 
        href={href} 
        target={isExternal ? '_blank' : undefined} 
        rel={isExternal ? 'noopener noreferrer' : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {showText && <span>{label}</span>}
      </Link>
    </Button>
  );
} 