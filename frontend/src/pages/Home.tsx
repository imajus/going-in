import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Ticket, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEvents, useTokenSymbol } from "@/hooks/useEventData";
import { ethers } from "ethers";

export default function Home() {
  const navigate = useNavigate();
  const { data: events, isLoading, error } = useEvents(20);
  const { data: tokenSymbol } = useTokenSymbol();
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        {import.meta.env.VITE_HERO_BACKGROUND_VIDEO && (
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={import.meta.env.VITE_HERO_BACKGROUND_VIDEO} type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30"></div>
        </div>
        )}
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent animate-fade-in">
            Your Ticket to the Future
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-8 animate-fade-in">
            Blockchain-powered ticketing that never crashes. No duplicates. No failures. Just pure concert vibes.
          </p>
          <div className="flex gap-4 justify-center animate-fade-in">
            <Button
              size="lg"
              className="shadow-glow hover:scale-105 transition-transform"
              onClick={() => {
                document.getElementById('events-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <TrendingUp className="mr-2 h-5 w-5" />
              Explore Events
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/50 hover:border-primary hover:bg-primary/10"
              onClick={() => navigate("/create")}
            >
              Create Event
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-20 px-4" id="events-section">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Featured Events
            </h2>
            <p className="text-muted-foreground text-lg">
              Don't miss out on the hottest shows this season
            </p>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border-border/50 bg-card/50 backdrop-blur p-4">
                  <Skeleton className="h-32 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </Card>
              ))}
            </div>
          )}

          {error && (
            <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
              <p className="text-destructive mb-4">Failed to load events</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
            </Card>
          )}

          {!isLoading && !error && events && events.length === 0 && (
            <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
              <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to create an event on the platform!
              </p>
              <Button onClick={() => navigate("/create")} className="shadow-glow">
                Create Event
              </Button>
            </Card>
          )}

          {!isLoading && !error && events && events.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((event) => {
                // Calculate total capacity and sold
                const totalCapacity = event.tiers.reduce((sum, tier) => sum + Number(tier.capacity), 0);
                const totalSold = event.tiers.reduce((sum, tier) => sum + Number(tier.sold), 0);
                const isSoldOut = totalSold >= totalCapacity;

                // Find minimum price
                const minPrice = event.tiers.reduce((min, tier) => {
                  const price = Number(ethers.formatUnits(tier.price, 18));
                  return price < min ? price : min;
                }, Number.MAX_VALUE);

                // Format event date
                const eventDate = new Date(Number(event.timestamp) * 1000);

                return (
                  <Card
                    key={event.id.toString()}
                    onClick={() => navigate(`/events/${event.id.toString()}`)}
                    className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-300 hover:shadow-accent hover:scale-105 cursor-pointer group"
                  >
                    <div className="p-4">
                      {isSoldOut && (
                        <Badge className="mb-2 bg-destructive">Sold Out</Badge>
                      )}
                      <h3 className="font-bold text-lg mb-2 line-clamp-1">{event.name}</h3>

                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{eventDate.toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span className="line-clamp-1">{event.venue}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-10">
                        <span className="font-bold text-primary">
                          From {minPrice.toFixed(2)} {tokenSymbol || 'TOKEN'}
                        </span>
                        <Button size="sm" disabled={isSoldOut} className="shadow-glow">
                          <Ticket className="mr-2 h-4 w-4" />
                          {isSoldOut ? "Sold Out" : "Get Tickets"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {!isLoading && events
                  ? events
                      .reduce((sum, e) => sum + e.tiers.reduce((s, t) => s + Number(t.sold), 0), 0)
                      .toLocaleString()
                  : "..."}
              </div>
              <div className="text-muted-foreground">Tickets Sold</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                10,000+
              </div>
              <div className="text-muted-foreground">TPS Capacity</div>
            </div>
            <div className="space-y-2">
              <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                0%
              </div>
              <div className="text-muted-foreground">System Failures</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
