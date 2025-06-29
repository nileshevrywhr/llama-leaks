import { Button } from "@/components/ui/button";
import { Menu, Shield, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useState, useEffect } from "react";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* Desktop Navigation */}
          <div className="mr-4 hidden md:flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              <Shield className="h-5 w-5 text-destructive" />
              <span className="hidden font-bold sm:inline-block">
                Unsecured oLLaMa
              </span>
            </a>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="#features"
              >
                Vulnerabilities
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="#scanner"
              >
                Scanner
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="#solutions"
              >
                Solutions
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/leaderboard"
              >
                Leaderboard
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/pricing"
              >
                Pricing
              </a>
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="/about"
              >
                About
              </a>
            </nav>
          </div>
          
          {/* Mobile Layout - Centered Title */}
          <div className="flex items-center justify-between w-full md:hidden">
            {/* Left Side - Hamburger Menu */}
            <div className="flex-shrink-0">
              <button 
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-11 w-11"
                aria-label="Toggle navigation menu"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </button>
            </div>
            
            {/* Center - Title */}
            <div className="flex-1 flex justify-center">
              <a className="flex items-center space-x-2" href="/">
                <Shield className="h-5 w-5 text-destructive" />
                <span className="font-bold text-sm">
                  Unsecured oLLaMa
                </span>
              </a>
            </div>
            
            {/* Right Side - Theme Toggle */}
            <div className="flex-shrink-0">
              <ThemeToggle />
            </div>
          </div>
          
          {/* Desktop Right Side - Theme Toggle Only */}
          <div className="hidden md:flex items-center justify-end space-x-2 md:flex-1">
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Positioned below header */}
      {isMobileMenuOpen && (
        <div className="fixed top-14 left-0 right-0 bottom-0 z-40 md:hidden">
          {/* Semi-transparent backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
          
          {/* Centered menu panel */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative bg-background/95 backdrop-blur-md border border-border rounded-lg shadow-lg w-full max-w-sm mx-auto">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  <span className="font-bold text-sm">Menu</span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="inline-flex items-center justify-center rounded-md h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close menu</span>
                </button>
              </div>
              
              {/* Navigation Links */}
              <nav className="p-4">
                <div className="space-y-3">
                  <a
                    href="#features"
                    onClick={closeMobileMenu}
                    className="flex items-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Vulnerabilities
                  </a>
                  <a
                    href="#scanner"
                    onClick={closeMobileMenu}
                    className="flex items-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Scanner
                  </a>
                  <a
                    href="#solutions"
                    onClick={closeMobileMenu}
                    className="flex items-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Solutions
                  </a>
                  <a
                    href="/leaderboard"
                    onClick={closeMobileMenu}
                    className="flex items-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Leaderboard
                  </a>
                  <a
                    href="/pricing"
                    onClick={closeMobileMenu}
                    className="flex items-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Pricing
                  </a>
                  <a
                    href="/about"
                    onClick={closeMobileMenu}
                    className="flex items-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    About
                  </a>
                </div>
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;