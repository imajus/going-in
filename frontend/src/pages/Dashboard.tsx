import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, DollarSign, TrendingUp, Users, Download } from "lucide-react";

const ORGANIZER_EVENTS = [
  {
    id: 1,
    name: "Neon Dreams Festival",
    date: "2025-11-15T20:00:00",
    totalRevenue: "125000",
    availableWithdrawal: "125000",
    refundDeadline: "2025-11-14T08:00:00",
    tiers: [
      { name: "VIP Experience", capacity: 200, sold: 187, price: "150" },
      { name: "Premium", capacity: 500, sold: 423, price: "100" },
      { name: "General Admission", capacity: 1000, sold: 756, price: "50" },
    ],
  },
  {
    id: 2,
    name: "Summer Beats 2024",
    date: "2024-08-20T18:00:00",
    totalRevenue: "98000",
    availableWithdrawal: "0",
    refundDeadline: "2024-08-19T06:00:00",
    tiers: [
      { name: "VIP", capacity: 150, sold: 150, price: "120" },
      { name: "General", capacity: 800, sold: 800, price: "60" },
    ],
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Organizer Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your events and manage revenue
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">2</div>
                  <div className="text-sm text-muted-foreground">Total Events</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/20 rounded-lg">
                  <Users className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">2,316</div>
                  <div className="text-sm text-muted-foreground">Tickets Sold</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-secondary/20 rounded-lg">
                  <DollarSign className="h-6 w-6 text-secondary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">223K</div>
                  <div className="text-sm text-muted-foreground">Total Revenue</div>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/20 rounded-lg">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">125K</div>
                  <div className="text-sm text-muted-foreground">Available</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Events List */}
          <div className="space-y-6">
            {ORGANIZER_EVENTS.map((event) => {
              const totalCapacity = event.tiers.reduce((sum, t) => sum + t.capacity, 0);
              const totalSold = event.tiers.reduce((sum, t) => sum + t.sold, 0);
              const soldPercentage = (totalSold / totalCapacity) * 100;
              const canWithdraw = new Date(event.refundDeadline) < new Date();

              return (
                <Card key={event.id} className="p-6 border-border/50 bg-card/50 backdrop-blur">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(event.date).toLocaleString()}</span>
                        </div>
                        <Badge variant={canWithdraw ? "secondary" : "default"}>
                          {canWithdraw ? "Withdrawable" : "Refund Period Active"}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary mb-1">
                        {event.totalRevenue}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Revenue</div>
                    </div>
                  </div>

                  {/* Overall Progress */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Sales</span>
                      <span className="text-sm text-muted-foreground">
                        {totalSold} / {totalCapacity} tickets
                      </span>
                    </div>
                    <Progress value={soldPercentage} />
                  </div>

                  {/* Tier Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {event.tiers.map((tier, index) => {
                      const tierSoldPercentage = (tier.sold / tier.capacity) * 100;
                      const tierRevenue = tier.sold * parseInt(tier.price);
                      
                      return (
                        <Card key={index} className="p-4 border-primary/20 bg-background/30">
                          <div className="mb-3">
                            <h3 className="font-bold mb-1">{tier.name}</h3>
                            <div className="text-2xl font-bold text-primary">
                              {tierRevenue.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {tier.sold} × {tier.price} USDC
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Sold</span>
                              <span className="font-medium">
                                {tier.sold} / {tier.capacity}
                              </span>
                            </div>
                            <Progress value={tierSoldPercentage} className="h-2" />
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4">
                    <Button
                      className="flex-1 shadow-glow"
                      disabled={!canWithdraw || event.availableWithdrawal === "0"}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Withdraw {event.availableWithdrawal} USDC
                    </Button>
                    <Button variant="outline" className="border-primary/50">
                      View Details
                    </Button>
                  </div>

                  {!canWithdraw && (
                    <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-md">
                      <p className="text-sm text-muted-foreground">
                        Revenue will be available for withdrawal after{" "}
                        {new Date(event.refundDeadline).toLocaleString()}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
