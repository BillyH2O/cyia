"use client";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { scrollToElement } from "@/lib/utils";

export function MainNavbar() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignInClick = () => {
    if (session) {
      router.push("/dashboard");
    } else {
      router.push("/auth/signin");
    }
  };

  const handleNavItemClick = (e: React.MouseEvent<HTMLAnchorElement>, link: string) => {
    e.preventDefault();
    const sectionId = link.replace('#', '');
    scrollToElement(sectionId);
  };

  const navItems = [
    {
      name: "Fonctionnalités",
      link: "#features",
    },
    {
      name: "Solutions",
      link: "#solutions",
    },
    {
      name: "FAQ",
      link: "#faq",
    },
    {
      name: "GitHub",
      link: "https://github.com/BillyH2O/cyia",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems 
            items={navItems} 
            onItemClick={(e: React.MouseEvent<HTMLAnchorElement>, item: { link: string }) => 
              handleNavItemClick(e, item.link)
            }
          />
          <div className="flex items-center gap-4">
            <NavbarButton 
              variant="primary" 
              onClick={handleSignInClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              Se connecter
            </NavbarButton>
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={(e) => {
                  handleNavItemClick(e, item.link);
                  setIsMobileMenuOpen(false);
                }}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              <NavbarButton
                onClick={() => { handleSignInClick(); setIsMobileMenuOpen(false); }}
                variant="primary"
                className="bg-primary hover:bg-blue-700 text-white font-medium w-full"
              >
                Se connecter
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
} 