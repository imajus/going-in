import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, X, Calendar } from "lucide-react";
import { useState } from "react";

interface Tier {
  name: string;
  capacity: string;
  price: string;
}

export default function CreateEvent() {
  const [tiers, setTiers] = useState<Tier[]>([
    { name: "General Admission", capacity: "1000", price: "50" },
  ]);

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
            <form className="space-y-8">
              {/* Basic Info */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-primary">Event Details</h2>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name</Label>
                  <Input
                    id="name"
                    placeholder="Neon Dreams Festival"
                    className="bg-background/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      placeholder="Arcology Arena"
                      className="bg-background/50"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Event Date</Label>
                    <Input
                      id="date"
                      type="datetime-local"
                      className="bg-background/50"
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
                <Button type="submit" className="flex-1 shadow-glow">
                  <Calendar className="mr-2 h-5 w-5" />
                  Create Event
                </Button>
                <Button type="button" variant="outline" className="border-primary/50">
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
