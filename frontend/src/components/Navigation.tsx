import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Ticket, Plus, LayoutDashboard, Wallet } from "lucide-react";

export const Navigation = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <Ticket className="h-6 w-6 text-primary" />
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Goin' In
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Events
            </Link>
            <Link
              to="/create"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/create") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Create Event
            </Link>
            <Link
              to="/tickets"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/tickets") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              My Tickets
            </Link>
            <Link
              to="/dashboard"
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Dashboard
            </Link>
          </div>
          
          <Button className="shadow-glow">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  );
};
