
import { Button } from "@/components/ui/button";
import { Github, Menu, Shield } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <header className="sticky top-12 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
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
        <button className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 py-2 mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </button>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="w-9 px-0">
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
