import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, User, Clock, Ticket, TrendingUp, Loader2, Coins } from "lucide-react";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { useWallet } from "@/hooks/useWallet";
import { useTicketingCore, usePaymentToken } from "@/hooks/useContract";
import { useEvent, useTokenBalance, useInvalidateQueries } from "@/hooks/useEventData";
import { formatAddress } from "@/lib/web3";
import { ethers } from "ethers";
import { toast } from "sonner";

export default function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { address, isConnected } = useWallet();
  const contract = useTicketingCore(true);
  const paymentToken = usePaymentToken(true);
  const { invalidateEvent, invalidateTokenBalance } = useInvalidateQueries();

  const eventId = id ? BigInt(id) : null;
  const { data: event, isLoading, error } = useEvent(eventId);
  const { data: tokenBalance } = useTokenBalance(address);

  const [purchasingTier, setPurchasingTier] = useState<number | null>(null);
  const [mintingTokens, setMintingTokens] = useState(false);

  const handleMintTestTokens = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    setMintingTokens(true);
    try {
      toast.info("Minting 1000 test tokens...");

      // Mint 1 million tokens (18 decimals)
      const tx = await paymentToken.mint(address!, ethers.parseUnits("1000", 18));
      await tx.wait();

      invalidateTokenBalance(address!);
      toast.success("Successfully minted 1000 test tokens!");
    } catch (error: any) {
      console.error("Error minting tokens:", error);
      if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction was rejected");
      } else {
        toast.error(error.message || "Failed to mint tokens");
      }
    } finally {
      setMintingTokens(false);
    }
  };

  const handlePurchase = async (tierIdx: number) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!event) return;

    const tier = event.tiers[tierIdx];
    const price = tier.price;

    setPurchasingTier(tierIdx);

    try {
      // Check token balance
      if (tokenBalance && tokenBalance < price) {
        toast.error("Insufficient token balance");
        setPurchasingTier(null);
        return;
      }

      // Step 1: Check allowance
      toast.info("Checking token allowance...");
      const contractAddress = await contract.getAddress();
      const currentAllowance = await paymentToken.allowance.staticCall(address!, contractAddress);

      // Step 2: Approve if needed
      if (currentAllowance < price) {
        toast.info("Approving tokens...");
        const approveTx = await paymentToken.approve(contractAddress, price);
        await approveTx.wait();
        toast.success("Tokens approved!");
      }

      // Step 3: Purchase ticket
      toast.info("Purchasing ticket...");
      const purchaseTx = await contract.purchaseTicket(event.id, BigInt(tierIdx));
      await purchaseTx.wait();

      // Invalidate caches
      invalidateEvent(event.id);
      invalidateTokenBalance(address!);

      toast.success("Ticket purchased successfully! Check 'My Tickets' page.");
    } catch (error: any) {
      console.error("Error purchasing ticket:", error);
      if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction was rejected");
      } else {
        toast.error(error.message || "Failed to purchase ticket");
      }
    } finally {
      setPurchasingTier(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 px-4">
          <div className="container mx-auto py-12">
            <Skeleton className="h-12 w-3/4 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-24 px-4">
          <div className="container mx-auto py-12">
            <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
              <p className="text-destructive mb-4">Failed to load event</p>
              <p className="text-sm text-muted-foreground">{error?.message || "Event not found"}</p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const eventDate = new Date(Number(event.timestamp) * 1000);
  const refundDeadline = new Date(eventDate.getTime() - 12 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                  {event.name}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{eventDate.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Organizer: {formatAddress(event.organizer)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>Refund until: {refundDeadline.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Token Balance & Mint Button */}
              {isConnected && (
                <Card className="p-4 border-primary/20 bg-gradient-primary/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Your Token Balance</p>
                      <p className="text-2xl font-bold">
                        {tokenBalance ? ethers.formatUnits(tokenBalance, 18) : "0"} USDC
                      </p>
                    </div>
                    <Button
                      onClick={handleMintTestTokens}
                      disabled={mintingTokens}
                      variant="outline"
                      className="border-primary/50"
                    >
                      {mintingTokens ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Minting...
                        </>
                      ) : (
                        <>
                          <Coins className="mr-2 h-4 w-4" />
                          Mint Test Tokens
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              )}

              {/* Ticket Tiers */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary">Select Your Tier</h2>

                {event.tiers.map((tier, index) => {
                  const sold = Number(tier.sold);
                  const capacity = Number(tier.capacity);
                  const soldPercentage = (sold / capacity) * 100;
                  const available = capacity - sold;
                  const isSoldOut = available === 0;
                  const price = ethers.formatUnits(tier.price, 18);
                  const isPurchasing = purchasingTier === index;

                  return (
                    <Card
                      key={index}
                      className={`p-6 border-border/50 bg-card/50 backdrop-blur transition-all duration-300 ${
                        !isSoldOut && "hover:border-primary/50 hover:shadow-accent"
                      } ${isSoldOut && "opacity-60"}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            NFT: {formatAddress(tier.nftContract)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{price} USDC</div>
                          <div className="text-sm text-muted-foreground">
                            {available} / {capacity} available
                          </div>
                        </div>
                      </div>

                      <Progress value={soldPercentage} className="mb-4" />

                      <Button
                        className="w-full shadow-glow"
                        disabled={isSoldOut || !isConnected || isPurchasing}
                        onClick={() => handlePurchase(index)}
                      >
                        {isPurchasing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Purchasing...
                          </>
                        ) : (
                          <>
                            <Ticket className="mr-2 h-4 w-4" />
                            {isSoldOut ? "Sold Out" : isConnected ? "Purchase Ticket" : "Connect Wallet"}
                          </>
                        )}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                <h3 className="text-xl font-bold mb-4 text-primary">Event Stats</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Capacity</span>
                    <span className="font-bold">
                      {event.tiers.reduce((sum, t) => sum + Number(t.capacity), 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tickets Sold</span>
                    <span className="font-bold text-primary">
                      {event.tiers.reduce((sum, t) => sum + Number(t.sold), 0)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-bold text-accent">
                      {event.tiers.reduce((sum, t) => sum + (Number(t.capacity) - Number(t.sold)), 0)}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-primary/20 bg-gradient-primary/5 backdrop-blur">
                <div className="flex items-start gap-3 mb-4">
                  <TrendingUp className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <h3 className="font-bold mb-2">Blockchain Guarantee</h3>
                    <p className="text-sm text-muted-foreground">
                      Every ticket is a unique NFT. No duplicates, no system crashes, atomic payment & delivery guaranteed.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
