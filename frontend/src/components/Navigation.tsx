import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Wallet, AlertCircle } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { formatAddress } from "@/lib/web3";
import { toast } from "sonner";

export const Navigation = () => {
  const location = useLocation();
  const { address, isConnected, isConnecting, connect, disconnect, isCorrectNetwork, switchNetwork } = useWallet();

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
              <Button
                onClick={handleSwitchNetwork}
                variant="destructive"
                size="sm"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Wrong Network
              </Button>
            )}

            {isConnected ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono">
                  {formatAddress(address!)}
                </Badge>
                <Button onClick={disconnect} variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button onClick={handleConnect} className="shadow-glow" disabled={isConnecting}>
                <Wallet className="mr-2 h-4 w-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
