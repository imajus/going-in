import { useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, Download, TrendingUp, Users } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useOrganizerEvents } from "@/hooks/useEventData";
import { formatEther } from "ethers";
import { useNavigate } from "react-router-dom";
import { RevenueWithdrawal } from "@/components/RevenueWithdrawal";

export default function Dashboard() {
  const { address, isConnected } = useWallet();
  const navigate = useNavigate();
  const { data: events = [], isLoading } = useOrganizerEvents(address || null);

  // Calculate aggregate statistics
  const stats = useMemo(() => {
    let totalTicketsSold = 0;
    let totalRevenue = BigInt(0);
    let totalAvailable = BigInt(0);

    events.forEach((event) => {
      event.tiers.forEach((tier) => {
        totalTicketsSold += Number(tier.sold);
        totalRevenue += tier.sold * tier.price;
      });
    });

    return {
      totalEvents: events.length,
      totalTicketsSold,
      totalRevenue,
      totalAvailable,
    };
  }, [events]);

  // Show wallet connection prompt if not connected
  if (!isConnected || !address) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-7xl">
            <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">Wallet Not Connected</h3>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to view your organizer dashboard
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
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Organizer Dashboard
            </h1>
            <p className="text-muted-foreground text-lg">
              Track your events and manage revenue
            </p>
          </div>

          {isLoading ? (
            <>
              {/* Stats Overview Loading */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>

              {/* Events List Loading */}
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-96 w-full" />
                ))}
              </div>
            </>
          ) : events.length === 0 ? (
            <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first event to start selling tickets
              </p>
              <Button className="shadow-glow" onClick={() => navigate('/create')}>
                Create Event
              </Button>
            </Card>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stats.totalEvents}</div>
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
                      <div className="text-2xl font-bold">{stats.totalTicketsSold.toLocaleString()}</div>
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
                      <div className="text-2xl font-bold">
                        {parseFloat(formatEther(stats.totalRevenue)).toFixed(2)}
                      </div>
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
                      <div className="text-2xl font-bold">
                        {parseFloat(formatEther(stats.totalAvailable)).toFixed(2)}
                      </div>
                      <div className="text-sm text-muted-foreground">Available</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Events List */}
              <div className="space-y-6">
                {events.map((event) => {
                  const totalCapacity = event.tiers.reduce((sum, t) => sum + Number(t.capacity), 0);
                  const totalSold = event.tiers.reduce((sum, t) => sum + Number(t.sold), 0);
                  const soldPercentage = totalCapacity > 0 ? (totalSold / totalCapacity) * 100 : 0;

                  // Calculate total revenue for this event
                  const eventRevenue = event.tiers.reduce(
                    (sum, tier) => sum + tier.sold * tier.price,
                    BigInt(0)
                  );

                  // Calculate refund deadline (event timestamp - 12 hours)
                  const refundDeadline = Number(event.timestamp) - 12 * 60 * 60;
                  const refundDeadlineDate = new Date(refundDeadline * 1000);
                  const canWithdraw = Date.now() > refundDeadline * 1000;

                  return (
                    <Card key={event.id.toString()} className="p-6 border-border/50 bg-card/50 backdrop-blur">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h2 className="text-2xl font-bold mb-2">{event.name}</h2>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(Number(event.timestamp) * 1000).toLocaleString()}</span>
                            </div>
                            <Badge variant={canWithdraw ? 'secondary' : 'default'}>
                              {canWithdraw ? 'Withdrawable' : 'Refund Period Active'}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary mb-1">
                            {parseFloat(formatEther(eventRevenue)).toFixed(2)}
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
                          const tierSold = Number(tier.sold);
                          const tierCapacity = Number(tier.capacity);
                          const tierSoldPercentage =
                            tierCapacity > 0 ? (tierSold / tierCapacity) * 100 : 0;
                          const tierRevenue = tier.sold * tier.price;

                          return (
                            <Card key={index} className="p-4 border-primary/20 bg-background/30">
                              <div className="mb-3">
                                <h3 className="font-bold mb-1">{tier.name}</h3>
                                <div className="text-2xl font-bold text-primary">
                                  {parseFloat(formatEther(tierRevenue)).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {tierSold} × {parseFloat(formatEther(tier.price)).toFixed(2)} tokens
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Sold</span>
                                  <span className="font-medium">
                                    {tierSold} / {tierCapacity}
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
                        <RevenueWithdrawal
                          eventId={event.id}
                          canWithdraw={canWithdraw}
                          organizerAddress={address!}
                        />
                        <Button
                          variant="outline"
                          className="border-primary/50"
                          onClick={() => navigate(`/events/${event.id.toString()}`)}
                        >
                          View Details
                        </Button>
                      </div>

                      {!canWithdraw && (
                        <div className="mt-4 p-3 bg-accent/10 border border-accent/20 rounded-md">
                          <p className="text-sm text-muted-foreground">
                            Revenue will be available for withdrawal after{' '}
                            {refundDeadlineDate.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
