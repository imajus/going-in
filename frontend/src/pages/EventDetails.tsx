import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, User, Clock, Ticket, TrendingUp } from "lucide-react";

const EVENT = {
  id: 1,
  name: "Neon Dreams Festival",
  venue: "Arcology Arena",
  date: "2025-11-15T20:00:00",
  organizer: "0x1234...5678",
  description: "Experience the ultimate electronic music festival featuring world-class DJs, stunning visual effects, and the power of blockchain ticketing. No crashes, no duplicates, just pure festival magic.",
  image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&h=600&fit=crop",
  tags: ["EDM", "Festival", "All Ages"],
  tiers: [
    {
      name: "VIP Experience",
      capacity: 200,
      sold: 187,
      price: "150",
      nftAddress: "0xVIP...NFT",
    },
    {
      name: "Premium",
      capacity: 500,
      sold: 423,
      price: "100",
      nftAddress: "0xPREM...NFT",
    },
    {
      name: "General Admission",
      capacity: 1000,
      sold: 756,
      price: "50",
      nftAddress: "0xGEN...NFT",
    },
  ],
};

export default function EventDetails() {
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
                  {EVENT.name}
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <span>{new Date(EVENT.date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{EVENT.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Organizer: {EVENT.organizer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <span>12h refund deadline</span>
                  </div>
                </div>
              </div>

              {/* Ticket Tiers */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-primary">Select Your Tier</h2>
                
                {EVENT.tiers.map((tier, index) => {
                  const soldPercentage = (tier.sold / tier.capacity) * 100;
                  const available = tier.capacity - tier.sold;
                  const isSoldOut = available === 0;
                  
                  return (
                    <Card
                      key={index}
                      className={`p-6 border-border/50 bg-card/50 backdrop-blur transition-all duration-300 ${
                        !isSoldOut && "hover:border-primary/50 hover:shadow-accent cursor-pointer"
                      } ${isSoldOut && "opacity-60"}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                          <p className="text-sm text-muted-foreground">NFT: {tier.nftAddress}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{tier.price} USDC</div>
                          <div className="text-sm text-muted-foreground">
                            {available} / {tier.capacity} available
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={soldPercentage} className="mb-4" />
                      
                      <Button
                        className="w-full shadow-glow"
                        disabled={isSoldOut}
                      >
                        <Ticket className="mr-2 h-4 w-4" />
                        {isSoldOut ? "Sold Out" : "Purchase Ticket"}
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
                      {EVENT.tiers.reduce((sum, t) => sum + t.capacity, 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Tickets Sold</span>
                    <span className="font-bold text-primary">
                      {EVENT.tiers.reduce((sum, t) => sum + t.sold, 0)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-bold text-accent">
                      {EVENT.tiers.reduce((sum, t) => sum + (t.capacity - t.sold), 0)}
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
