"use client";

import React from "react";
import Link from "next/link";

const navLinks = [
  {
    name: "Accueil",
    href: "#",
  },
  {
    name: "Fonctionnalités",
    href: "#features",
  },
  {
    name: "Solutions",
    href: "#solutions",
  },
  {
    name: "FAQ",
    href: "#faq",
  },
  {
    name: "Contact",
    href: "#contact",
  },
];

export function Footer() {
  return (
    <footer className="flex w-full flex-col border-t" id="contact">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 py-12 lg:px-8 gap-6">
        <div className="flex items-center justify-center">
          <img 
            src="/cytech_logo.png" 
            alt="CY Tech Logo" 
            className="h-11 w-auto"
          />
          <span className="ml-2 text-medium font-medium text-foreground">CY IA</span>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
          {navLinks.map((item) => (
            <Link
              key={item.name}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              href={item.href}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <p className="mt-1 text-center text-sm text-gray-400">
          &copy; 2025 CY IA
        </p>
      </div>
    </footer>
  );
} 