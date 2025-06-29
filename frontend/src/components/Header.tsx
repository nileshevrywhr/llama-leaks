import { Button } from "@/components/ui/button";
import { Menu, Shield, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

  // Handle solutions navigation with proper scrolling
  const handleSolutionsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (location.pathname === "/") {
      // Same page - just scroll to solutions
      const solutionsElement = document.getElementById("solutions");
      if (solutionsElement) {
        solutionsElement.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      // Different page - navigate to homepage then scroll
      navigate("/");
      // Small delay to ensure page loads before scrolling
      setTimeout(() => {
        const solutionsElement = document.getElementById("solutions");
        if (solutionsElement) {
          solutionsElement.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* Desktop Navigation */}
          <div className="mr-4 hidden md:flex">
            <Link className="mr-6 flex items-center space-x-2" to="/">
              <Shield className="h-5 w-5 text-destructive" />
              <span className="hidden font-bold sm:inline-block">
                Ollama Wall
              </span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                href="#solutions"
                onClick={handleSolutionsClick}
              >
                Solutions
              </a>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                to="/leaderboard"
              >
                Leaderboard
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                to="/pricing"
              >
                Pricing
              </Link>
              <Link
                className="transition-colors hover:text-foreground/80 text-foreground/60"
                to="/about"
              >
                About
              </Link>
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
              <Link className="flex items-center space-x-2" to="/">
                <Shield className="h-5 w-5 text-destructive" />
                <span className="font-bold text-sm">
                  Ollama Wall
                </span>
              </Link>
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
              
              {/* Navigation Links */}
              <nav className="p-6">
                <div className="space-y-4">
                  <a
                    href="#solutions"
                    onClick={(e) => {
                      handleSolutionsClick(e);
                      closeMobileMenu();
                    }}
                    className="block text-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Solutions
                  </a>
                  <Link
                    to="/leaderboard"
                    onClick={closeMobileMenu}
                    className="block text-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Leaderboard
                  </Link>
                  <Link
                    to="/pricing"
                    onClick={closeMobileMenu}
                    className="block text-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    Pricing
                  </Link>
                  <Link
                    to="/about"
                    onClick={closeMobileMenu}
                    className="block text-center py-4 px-4 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    About
                  </Link>
                </div>
              </nav>
              
              {/* Close button at bottom center */}
              <div className="flex justify-center p-4 border-t border-border">
                <button
                  onClick={closeMobileMenu}
                  className="inline-flex items-center justify-center rounded-md h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close menu</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;