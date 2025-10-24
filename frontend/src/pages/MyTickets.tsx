import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, QrCode, RefreshCw, Ticket, TrendingUp, TrendingDown, ShoppingBag } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { type UserTicket, useInvalidateQueries, useTokenSymbol } from "@/hooks/useEventData";
import { useUserPortfolio, useUserActiveTickets } from "@/hooks/useGraphQL";
import { useTicketingCore } from "@/hooks/useContract";
import { formatEther, ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { QRCodeSVG } from "qrcode.react";
import { formatAddress, formatTokenId } from "@/lib/web3";

export default function MyTickets() {
  const { address, isConnected } = useWallet();
  const navigate = useNavigate();
  const { data: tickets = [], isLoading } = useUserActiveTickets(address || undefined);

  // Fetch user portfolio statistics from GraphQL indexer (30s refetch)
  const { data: userPortfolio } = useUserPortfolio(address || undefined);

  const ticketingCore = useTicketingCore(true); // With signer for transactions
  const { invalidateUserTickets, invalidateEvent } = useInvalidateQueries();
  const { data: tokenSymbol } = useTokenSymbol();

  // State for refund dialog
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);
  const [isRefunding, setIsRefunding] = useState(false);

  // State for QR code dialog
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [qrTicket, setQrTicket] = useState<UserTicket | null>(null);

  // Get current timestamp in seconds
  const currentTimestamp = BigInt(Math.floor(Date.now() / 1000));

  // Filter tickets by upcoming/past
  const upcomingTickets = tickets.filter(
    (ticket) => ticket.eventData && ticket.eventData.timestamp > currentTimestamp
  );
  const pastTickets = tickets.filter(
    (ticket) => ticket.eventData && ticket.eventData.timestamp <= currentTimestamp
  );

  // Handle QR code button click
  const handleShowQR = (ticket: UserTicket) => {
    setQrTicket(ticket);
    setQrDialogOpen(true);
  };

  // Handle refund button click
  const handleRefundClick = (ticket: UserTicket) => {
    setSelectedTicket(ticket);
    setRefundDialogOpen(true);
  };

  // Handle refund transaction
  const handleRefund = async () => {
    if (!selectedTicket || !address) {
      return;
    }

    setIsRefunding(true);
    try {
      // Call refundTicket function
      const tx = await ticketingCore.refundTicket(
        selectedTicket.eventId,
        selectedTicket.tierIdx,
        selectedTicket.tokenId
      );

      toast.loading(`Refunding ticket... Transaction: ${tx.hash.slice(0, 10)}...`, {
        id: tx.hash,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        toast.success(
          `Refund successful! You received ${formatEther(selectedTicket.price)} tokens back.`,
          {
            id: tx.hash,
          }
        );

        // Invalidate queries to refresh data
        invalidateUserTickets(address);
        invalidateEvent(selectedTicket.eventId);

        // Close dialog
        setRefundDialogOpen(false);
        setSelectedTicket(null);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Refund error:', error);

      let errorMessage = 'Failed to refund ticket. Please try again.';

      if (error.message?.includes('after deadline')) {
        errorMessage = 'Refund deadline has passed for this ticket.';
      } else if (error.message?.includes('not owner')) {
        errorMessage = 'You are not the owner of this ticket.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected.';
      }

      toast.error(errorMessage);
    } finally {
      setIsRefunding(false);
    }
  };

  const TicketCard = ({ ticket }: { ticket: UserTicket }) => {
    if (!ticket.eventData) {
      return null;
    }

    const isUpcoming = ticket.eventData.timestamp > currentTimestamp;
    const isRefundable = ticket.refundEligible;

    // Format price (assuming 18 decimals for the payment token)
    const priceFormatted = formatEther(ticket.price);

    // Format dates
    const eventDate = new Date(Number(ticket.eventData.timestamp) * 1000);
    const refundDeadlineDate = ticket.refundDeadline
      ? new Date(Number(ticket.refundDeadline) * 1000)
      : null;

    // Truncate NFT address
    const truncatedNftAddress = `${ticket.nftContract.slice(0, 6)}...${ticket.nftContract.slice(-4)}`;

    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{ticket.tierName}</Badge>
            </div>
            <h3 className="text-2xl font-bold mb-2">{ticket.eventData.name}</h3>

            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{eventDate.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{ticket.eventData.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <span className="text-xs">NFT: {truncatedNftAddress}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-2xl font-bold text-primary">{priceFormatted} {tokenSymbol || 'TOKEN'}</div>
          </div>
        </div>

        {isUpcoming && (
          <>
            {isRefundable && refundDeadlineDate && (
              <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Refund available for{' '}
                  {formatDistanceToNow(refundDeadlineDate, { addSuffix: false })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Deadline: {refundDeadlineDate.toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 shadow-glow" onClick={() => handleShowQR(ticket)}>
                <QrCode className="mr-2 h-4 w-4" />
                Show QR Code
              </Button>
              {isRefundable && (
                <Button
                  variant="outline"
                  className="border-destructive/50 hover:bg-destructive/10"
                  onClick={() => handleRefundClick(ticket)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Request Refund
                </Button>
              )}
            </div>
          </>
        )}

        {!isUpcoming && (
          <Badge variant="secondary" className="w-full justify-center py-2">
            Event Completed
          </Badge>
        )}
      </Card>
    );
  };

  // Show wallet connection prompt if not connected
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Wallet Not Connected</h3>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to view your tickets
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              My Tickets
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your NFT tickets and request refunds
            </p>
          </div>

          {/* Portfolio Summary - Powered by GraphQL Indexer */}
          {userPortfolio?.stats && (
            <Card className="mb-8 p-6 border-primary/20 bg-gradient-primary/5 backdrop-blur">
              <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Portfolio Summary
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {userPortfolio.stats.activeTickets}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Tickets</div>
                </div>

                <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
                  <div className="text-3xl font-bold mb-1 flex items-center justify-center gap-1">
                    <TrendingUp className="h-6 w-6 text-accent" />
                    {userPortfolio.stats.totalTicketsPurchased}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Purchases</div>
                </div>

                <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
                  <div className="text-3xl font-bold mb-1 flex items-center justify-center gap-1">
                    <TrendingDown className="h-6 w-6 text-destructive" />
                    {userPortfolio.stats.totalTicketsRefunded}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Refunds</div>
                </div>

                <div className="text-center p-4 bg-card/50 rounded-lg border border-border/50">
                  <div className="text-2xl font-bold text-primary mb-1">
                    {ethers.formatUnits(userPortfolio.stats.totalSpent, 18)} {tokenSymbol || 'TOKEN'}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Spent</div>
                </div>
              </div>

              {userPortfolio.stats.totalRefunded !== "0" && (
                <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-md text-center">
                  <p className="text-sm">
                    <span className="font-semibold text-accent">
                      {ethers.formatUnits(userPortfolio.stats.totalRefunded, 18)} {tokenSymbol || 'TOKEN'}
                    </span>
                    {' '}refunded to your wallet
                  </p>
                </div>
              )}
            </Card>
          )}

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="upcoming" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="upcoming">
                  Upcoming ({upcomingTickets.length})
                </TabsTrigger>
                <TabsTrigger value="past">Past ({pastTickets.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="upcoming" className="space-y-4">
                {upcomingTickets.length > 0 ? (
                  upcomingTickets.map((ticket) => (
                    <TicketCard
                      key={`${ticket.eventId.toString()}-${ticket.tokenId.toString()}`}
                      ticket={ticket}
                    />
                  ))
                ) : (
                  <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">No Upcoming Tickets</h3>
                    <p className="text-muted-foreground mb-6">
                      You don't have any tickets for upcoming events
                    </p>
                    <Button className="shadow-glow" onClick={() => navigate('/')}>
                      Browse Events
                    </Button>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="past" className="space-y-4">
                {pastTickets.length > 0 ? (
                  pastTickets.map((ticket) => (
                    <TicketCard
                      key={`${ticket.eventId.toString()}-${ticket.tokenId.toString()}`}
                      ticket={ticket}
                    />
                  ))
                ) : (
                  <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
                    <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-bold mb-2">No Past Tickets</h3>
                    <p className="text-muted-foreground">
                      Your ticket history will appear here
                    </p>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund this ticket? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedTicket && (
            <div className="py-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Event:</span>
                <span className="font-semibold">{selectedTicket.eventData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tier:</span>
                <span className="font-semibold">{selectedTicket.tierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token ID:</span>
                <span className="font-semibold">{formatTokenId(selectedTicket.tokenId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refund Amount:</span>
                <span className="font-semibold text-primary">
                  {formatEther(selectedTicket.price)} {tokenSymbol || 'TOKEN'}
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRefunding}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                handleRefund();
              }}
              disabled={isRefunding}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isRefunding ? 'Processing...' : 'Confirm Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ticket QR Code</DialogTitle>
            <DialogDescription>
              Scan this QR code to verify your ticket or share it with event organizers.
            </DialogDescription>
          </DialogHeader>

          {qrTicket && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-lg">
                <QRCodeSVG
                  value={`nft://${qrTicket.nftContract}/${qrTicket.tokenId.toString()}`}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event:</span>
                  <span className="font-medium">{qrTicket.eventData?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tier:</span>
                  <span className="font-medium">{qrTicket.tierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Token ID:</span>
                  <span className="font-mono text-xs">{formatTokenId(qrTicket.tokenId)}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-muted-foreground">NFT Contract:</span>
                  <span className="font-mono text-xs text-right break-all max-w-[200px]">
                    {formatAddress(qrTicket.nftContract)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
