import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Calendar, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@/hooks/useWallet";
import { useTicketingCore } from "@/hooks/useContract";
import { useInvalidateQueries } from "@/hooks/useEventData";
import { ethers } from "ethers";
import { toast } from "sonner";

interface Tier {
  name: string;
  capacity: string;
  price: string;
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const contract = useTicketingCore(true);
  const { invalidateAllEvents } = useInvalidateQueries();

  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tiers, setTiers] = useState<Tier[]>([
    { name: "General Admission", capacity: "1000", price: "50" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTier = () => {
    if (tiers.length < 5) {
      setTiers([...tiers, { name: "", capacity: "", price: "" }]);
    }
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const updateTier = (index: number, field: keyof Tier, value: string) => {
    const updated = [...tiers];
    updated[index][field] = value;
    setTiers(updated);
  };

  const validateForm = (): string | null => {
    if (!eventName.trim()) return "Event name is required";
    if (!venue.trim()) return "Venue is required";
    if (!eventDate) return "Event date is required";

    // Check if date is at least 12 hours in the future
    const eventTimestamp = new Date(eventDate).getTime();
    const now = Date.now();
    const twelveHoursInMs = 12 * 60 * 60 * 1000;

    if (eventTimestamp < now + twelveHoursInMs) {
      return "Event must be at least 12 hours in the future";
    }

    // Validate tiers
    if (tiers.length === 0) return "At least one tier is required";

    const tierNames = new Set<string>();
    for (const tier of tiers) {
      if (!tier.name.trim()) return "All tier names are required";
      if (tierNames.has(tier.name)) return "Tier names must be unique";
      tierNames.add(tier.name);

      const capacity = parseInt(tier.capacity);
      if (isNaN(capacity) || capacity <= 0) return "Tier capacity must be greater than 0";

      const price = parseFloat(tier.price);
      if (isNaN(price) || price <= 0) return "Tier price must be greater than 0";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert date to Unix timestamp (seconds)
      const eventTimestamp = Math.floor(new Date(eventDate).getTime() / 1000);

      // Prepare tier configs for smart contract
      const tierConfigs = tiers.map((tier) => ({
        name: tier.name,
        capacity: BigInt(tier.capacity),
        price: ethers.parseUnits(tier.price, 18), // Parse price as 18 decimals (payment token)
      }));

      toast.info("Creating event on blockchain...");

      // Call createEvent on smart contract
      const tx = await contract.createEvent(
        eventName,
        venue,
        BigInt(eventTimestamp),
        tierConfigs
      );

      toast.info("Transaction submitted, waiting for confirmation...");

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Invalidate events cache to refetch
      invalidateAllEvents();

      toast.success("Event created successfully!");

      // Navigate to home page
      navigate("/");
    } catch (error: any) {
      console.error("Error creating event:", error);

      if (error.code === "ACTION_REJECTED") {
        toast.error("Transaction was rejected");
      } else {
        toast.error(error.message || "Failed to create event");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Create New Event
            </h1>
            <p className="text-muted-foreground text-lg">
              Launch your event on the blockchain and never worry about crashes again
            </p>
          </div>

          <Card className="p-8 border-border/50 bg-card/50 backdrop-blur">
            <form className="space-y-8" onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-primary">Event Details</h2>

                <div className="space-y-2">
                  <Label htmlFor="name">Event Name</Label>
                  <Input
                    id="name"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder="Neon Dreams Festival"
                    className="bg-background/50"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={venue}
                      onChange={(e) => setVenue(e.target.value)}
                      placeholder="Arcology Arena"
                      className="bg-background/50"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="bg-background/50"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Ticket Tiers */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-primary">Ticket Tiers</h2>
                  <Button
                    type="button"
                    onClick={addTier}
                    disabled={tiers.length >= 5}
                    variant="outline"
                    size="sm"
                    className="border-primary/50"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Tier
                  </Button>
                </div>

                <div className="space-y-4">
                  {tiers.map((tier, index) => (
                    <Card key={index} className="p-4 border-primary/20 bg-background/30">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`tier-name-${index}`}>Tier Name</Label>
                            <Input
                              id={`tier-name-${index}`}
                              value={tier.name}
                              onChange={(e) => updateTier(index, "name", e.target.value)}
                              placeholder="VIP"
                              className="bg-background/50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`tier-capacity-${index}`}>Capacity</Label>
                            <Input
                              id={`tier-capacity-${index}`}
                              type="number"
                              value={tier.capacity}
                              onChange={(e) => updateTier(index, "capacity", e.target.value)}
                              placeholder="500"
                              className="bg-background/50"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`tier-price-${index}`}>Price (USDC)</Label>
                            <Input
                              id={`tier-price-${index}`}
                              type="number"
                              value={tier.price}
                              onChange={(e) => updateTier(index, "price", e.target.value)}
                              placeholder="100"
                              className="bg-background/50"
                            />
                          </div>
                        </div>
                        
                        {tiers.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeTier(index)}
                            variant="ghost"
                            size="icon"
                            className="mt-8"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  You can add up to 5 ticket tiers. Each tier will be its own NFT collection.
                </p>
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 shadow-glow"
                  disabled={isSubmitting || !isConnected}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-5 w-5" />
                      Create Event
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-primary/50"
                  onClick={() => navigate("/")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
