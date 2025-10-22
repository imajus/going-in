import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Ticket, TrendingUp } from "lucide-react";

const FEATURED_EVENTS = [
  {
    id: 1,
    name: "Neon Dreams Festival",
    venue: "Arcology Arena",
    date: "2025-11-15",
    image: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
    price: "From $50",
    tags: ["EDM", "Festival", "All Ages"],
    soldOut: false,
  },
  {
    id: 2,
    name: "Cyber Pulse Night",
    venue: "Digital Dome",
    date: "2025-11-22",
    image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&h=600&fit=crop",
    price: "From $35",
    tags: ["Techno", "Underground"],
    soldOut: false,
  },
  {
    id: 3,
    name: "Electric Symphony",
    venue: "The Quantum",
    date: "2025-12-01",
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop",
    price: "From $75",
    tags: ["Live", "Orchestra", "Premium"],
    soldOut: true,
  },
  {
    id: 4,
    name: "Bass Revolution",
    venue: "Underground Club",
    date: "2025-12-08",
    image: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&h=600&fit=crop",
    price: "From $40",
    tags: ["Dubstep", "18+"],
    soldOut: false,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section with Video Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/background.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/50"></div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-secondary/20 to-accent/30"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent animate-fade-in">
            Your Ticket to the Future
          </h1>
          <p className="text-xl md:text-2xl text-foreground mb-8 animate-fade-in">
            Blockchain-powered ticketing that never crashes. No duplicates. No failures. Just pure concert vibes.
          </p>
          <div className="flex gap-4 justify-center animate-fade-in">
            <Button size="lg" className="shadow-glow hover:scale-105 transition-transform">
              <TrendingUp className="mr-2 h-5 w-5" />
              Explore Events
            </Button>
            <Button size="lg" variant="outline" className="border-primary/50 hover:border-primary hover:bg-primary/10">
              Create Event
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Featured Events
            </h2>
            <p className="text-muted-foreground text-lg">
              Don't miss out on the hottest shows this season
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURED_EVENTS.map((event) => (
              <Card
                key={event.id}
                className="border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-300 hover:shadow-accent hover:scale-105 cursor-pointer group"
              >
                <div className="p-4">
                  {event.soldOut && (
                    <Badge className="mb-2 bg-destructive">
                      Sold Out
                    </Badge>
                  )}
                  <h3 className="font-bold text-lg mb-2 line-clamp-1">{event.name}</h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary">{event.price}</span>
                    <Button size="sm" disabled={event.soldOut} className="shadow-glow">
                      <Ticket className="mr-2 h-4 w-4" />
                      {event.soldOut ? "Sold Out" : "Get Tickets"}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                100K+
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
