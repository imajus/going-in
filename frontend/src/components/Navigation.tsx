import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Ticket, Wallet, AlertCircle, Menu, Home, PlusCircle, TicketIcon, LayoutDashboard } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/lib/web3";
import { toast } from "sonner";

export const Navigation = () => {
  const location = useLocation();
  const { address, isConnected, isConnecting, connect, disconnect, isCorrectNetwork, switchNetwork } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleConnect = async () => {
    try {
      await connect();
      toast.success("Wallet connected successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet");
    }
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork();
      toast.success("Switched to Arcology Network!");
    } catch (error: any) {
      toast.error("Failed to switch network");
    }
  };

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

          <div className="flex items-center gap-3">
            {isConnected && !isCorrectNetwork && (
              <Button onClick={handleSwitchNetwork} variant="destructive" size="sm" className="hidden md:flex">
                <AlertCircle className="mr-2 h-4 w-4" />
                Wrong Network
              </Button>
            )}

            {isConnected ? (
              <div className="hidden md:flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {formatAddress(address!)}
                </Badge>
                <Button onClick={disconnect} variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} className="shadow-glow hidden md:flex" disabled={isConnecting}>
                <Wallet className="mr-2 h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    <span className="bg-gradient-primary bg-clip-text text-transparent">Goin' In</span>
                  </SheetTitle>
                  <SheetDescription>Navigate through the platform</SheetDescription>
                </SheetHeader>

                <div className="mt-8 flex flex-col gap-4">
                  {/* Wallet Connection Status */}
                  {isConnected && !isCorrectNetwork && (
                    <Button onClick={handleSwitchNetwork} variant="destructive" size="sm" className="w-full">
                      <AlertCircle className="mr-2 h-4 w-4" />
                      Wrong Network
                    </Button>
                  )}

                  {isConnected ? (
                    <div className="space-y-2">
                      <Badge variant="secondary" className="font-mono w-full justify-center">
                        {formatAddress(address!)}
                      </Badge>
                      <Button onClick={disconnect} variant="outline" size="sm" className="w-full">
                        Disconnect Wallet
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleConnect} className="shadow-glow w-full" disabled={isConnecting}>
                      <Wallet className="mr-2 h-4 w-4" />
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Button>
                  )}

                  <div className="border-t border-border my-4" />

                  {/* Navigation Links */}
                  <Link
                    to="/"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive('/') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    <span className="font-medium">Events</span>
                  </Link>

                  <Link
                    to="/create"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive('/create') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <PlusCircle className="h-5 w-5" />
                    <span className="font-medium">Create Event</span>
                  </Link>

                  <Link
                    to="/tickets"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive('/tickets') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <TicketIcon className="h-5 w-5" />
                    <span className="font-medium">My Tickets</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isActive('/dashboard') ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
