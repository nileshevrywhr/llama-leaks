
import { Button } from "@/components/ui/button";
import { Menu, Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Desktop Navigation */}
        <div className="mr-4 hidden md:flex">
          <a className="mr-6 flex items-center space-x-2" href="/">
            <Shield className="h-5 w-5 text-destructive" />
            <span className="hidden font-bold sm:inline-block">
              Ollama Security Alert
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
          </nav>
        </div>
        
        {/* Mobile Menu Button */}
        <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 py-2 mr-3 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </button>
        
        {/* Mobile Title */}
        <div className="flex-1 md:hidden">
          <a className="flex items-center space-x-2" href="/">
            <Shield className="h-5 w-5 text-destructive" />
            <span className="font-bold text-sm">
              Ollama Security Alert
            </span>
          </a>
        </div>
        
        {/* Right Side - Theme Toggle Only */}
        <div className="flex items-center justify-end space-x-2 md:flex-1">
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
