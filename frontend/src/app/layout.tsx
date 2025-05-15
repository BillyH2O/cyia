import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ChatProvider } from "@/contexts/ChatContext";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/features/layout/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CY IA",
  description: "Assistant IA pour CY Tech",
  icons: {
    icon: '/cytech_logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <ChatProvider>
            {children}
            <Toaster richColors position="top-right" />
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
