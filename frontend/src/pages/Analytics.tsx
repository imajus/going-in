import { useMemo } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  RefreshCw,
  Calendar,
  MapPin,
  Ticket,
  ArrowUpDown,
} from "lucide-react";
import { usePlatformStats, useTopEvents, useRecentActivity } from "@/hooks/useGraphQL";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { formatAddress } from "@/lib/web3";

export default function Analytics() {
  const navigate = useNavigate();
  const { data: platformStats, isLoading: statsLoading } = usePlatformStats();
  const { data: topEvents = [], isLoading: eventsLoading } = useTopEvents(10);
  const { data: recentActivity, isLoading: activityLoading } = useRecentActivity(20);

  // Prepare chart data for top events
  const topEventsChartData = useMemo(() => {
    return topEvents.map((item, index) => ({
      name: item.event?.name || `Event #${item.eventId}`,
      sales: item.stats.totalPurchases,
      revenue: parseFloat(ethers.formatUnits(item.stats.totalRevenue, 18)),
      rank: index + 1,
    }));
  }, [topEvents]);

  // Calculate net revenue for platform
  const netRevenue = useMemo(() => {
    if (!platformStats) return BigInt(0);
    return BigInt(platformStats.totalRevenue) - BigInt(platformStats.totalRefundAmount);
  }, [platformStats]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Platform Analytics
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time insights into platform performance and activity
            </p>
          </div>

          {/* Platform Stats Overview */}
          {statsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : platformStats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/20 rounded-lg">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{platformStats.totalEvents}</div>
                    <div className="text-sm text-muted-foreground">Total Events</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/20 rounded-lg">
                    <Ticket className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">
                      {platformStats.totalTicketsSold.toLocaleString()}
                    </div>
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
                    <div className="text-3xl font-bold">
                      {parseFloat(ethers.formatUnits(platformStats.totalRevenue, 18)).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Revenue</div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-destructive/20 rounded-lg">
                    <RefreshCw className="h-6 w-6 text-destructive" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{platformStats.totalRefunds}</div>
                    <div className="text-sm text-muted-foreground">Total Refunds</div>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center mb-8">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-bold mb-2">No Data Available</h3>
              <p className="text-muted-foreground">
                Platform statistics will appear here once events are created
              </p>
            </Card>
          )}

          {/* Additional Metrics */}
          {platformStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Revenue Breakdown</h3>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Gross Revenue</span>
                    <span className="text-xl font-bold text-primary">
                      {parseFloat(ethers.formatUnits(platformStats.totalRevenue, 18)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Refunds</span>
                    <span className="text-xl font-bold text-destructive">
                      -{parseFloat(ethers.formatUnits(platformStats.totalRefundAmount, 18)).toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Net Revenue</span>
                      <span className="text-2xl font-bold text-accent">
                        {parseFloat(ethers.formatUnits(netRevenue, 18)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Engagement Metrics</h3>
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Tickets per Event</span>
                    <span className="text-xl font-bold">
                      {platformStats.totalEvents > 0
                        ? Math.round(platformStats.totalTicketsSold / platformStats.totalEvents)
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Refund Rate</span>
                    <span className="text-xl font-bold">
                      {platformStats.totalTicketsSold > 0
                        ? ((platformStats.totalRefunds / platformStats.totalTicketsSold) * 100).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Revenue per Event</span>
                    <span className="text-xl font-bold text-secondary">
                      {platformStats.totalEvents > 0
                        ? parseFloat(
                            ethers.formatUnits(
                              BigInt(platformStats.totalRevenue) / BigInt(platformStats.totalEvents),
                              18
                            )
                          ).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Top Events & Recent Activity */}
          <Tabs defaultValue="leaderboard" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="leaderboard">Top Events</TabsTrigger>
              <TabsTrigger value="activity">Recent Activity</TabsTrigger>
            </TabsList>

            {/* Top Events Leaderboard */}
            <TabsContent value="leaderboard" className="space-y-6">
              {eventsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : topEvents.length === 0 ? (
                <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Events Yet</h3>
                  <p className="text-muted-foreground">
                    The leaderboard will show the top-performing events once tickets are sold
                  </p>
                </Card>
              ) : (
                <>
                  {/* Top Events Chart */}
                  {topEventsChartData.length > 0 && (
                    <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                      <h3 className="text-lg font-semibold mb-4">Sales by Event</h3>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topEventsChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis
                            dataKey="rank"
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            tick={{ fill: "hsl(var(--muted-foreground))" }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                          />
                          <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {/* Top Events List */}
                  <div className="space-y-4">
                    {topEvents.map((item, index) => {
                      const event = item.event;
                      const stats = item.stats;
                      const rank = index + 1;

                      return (
                        <Card
                          key={item.eventId}
                          className="p-6 border-border/50 bg-card/50 backdrop-blur hover:bg-card/70 transition-colors cursor-pointer"
                          onClick={() => event && navigate(`/events/${event.eventId}`)}
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`flex items-center justify-center w-12 h-12 rounded-lg font-bold text-xl ${
                                rank === 1
                                  ? "bg-yellow-500/20 text-yellow-500"
                                  : rank === 2
                                  ? "bg-gray-400/20 text-gray-400"
                                  : rank === 3
                                  ? "bg-amber-700/20 text-amber-700"
                                  : "bg-muted/50 text-muted-foreground"
                              }`}
                            >
                              #{rank}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-xl font-bold mb-1">
                                    {event?.name || `Event #${item.eventId}`}
                                  </h3>
                                  {event && (
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{event.venue}</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(Number(event.timestamp) * 1000).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <Badge variant={rank <= 3 ? "default" : "secondary"}>
                                  {rank <= 3 ? "Top Performer" : "Popular"}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                  <div className="text-sm text-muted-foreground mb-1">Tickets Sold</div>
                                  <div className="text-2xl font-bold text-primary">{stats.totalPurchases}</div>
                                </div>
                                <div className="p-3 bg-secondary/10 rounded-lg">
                                  <div className="text-sm text-muted-foreground mb-1">Revenue</div>
                                  <div className="text-2xl font-bold text-secondary">
                                    {parseFloat(ethers.formatUnits(stats.totalRevenue, 18)).toFixed(2)}
                                  </div>
                                </div>
                                <div className="p-3 bg-accent/10 rounded-lg">
                                  <div className="text-sm text-muted-foreground mb-1">Net Revenue</div>
                                  <div className="text-2xl font-bold text-accent">
                                    {parseFloat(ethers.formatUnits(stats.netRevenue, 18)).toFixed(2)}
                                  </div>
                                </div>
                                <div className="p-3 bg-destructive/10 rounded-lg">
                                  <div className="text-sm text-muted-foreground mb-1">Refunds</div>
                                  <div className="text-2xl font-bold text-destructive">{stats.totalRefunds}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>

            {/* Recent Activity Feed */}
            <TabsContent value="activity" className="space-y-6">
              {activityLoading ? (
                <div className="space-y-4">
                  {[...Array(10)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : !recentActivity ||
                (recentActivity.purchases.length === 0 &&
                  recentActivity.refunds.length === 0 &&
                  recentActivity.events.length === 0) ? (
                <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
                  <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Activity Yet</h3>
                  <p className="text-muted-foreground">
                    Recent platform activity will appear here once events are created and tickets are sold
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Recent Purchases */}
                  <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-primary" />
                      Recent Purchases
                    </h3>
                    <div className="space-y-3">
                      {recentActivity.purchases.slice(0, 10).map((purchase) => (
                        <div
                          key={purchase.id}
                          className="p-3 bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="default" className="text-xs">
                              Event #{purchase.eventId}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatAddress(purchase.buyer)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tier {purchase.tierIdx}</span>
                            <span className="text-sm font-semibold">
                              {parseFloat(ethers.formatUnits(purchase.price, 18)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Recent Refunds */}
                  <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-destructive" />
                      Recent Refunds
                    </h3>
                    <div className="space-y-3">
                      {recentActivity.refunds.slice(0, 10).map((refund) => (
                        <div
                          key={refund.id}
                          className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="destructive" className="text-xs">
                              Event #{refund.eventId}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">
                              {formatAddress(refund.buyer)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Tier {refund.tierIdx}</span>
                            <span className="text-sm font-semibold">
                              {parseFloat(ethers.formatUnits(refund.refundAmount, 18)).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Recent Events */}
                  <Card className="p-6 border-border/50 bg-card/50 backdrop-blur">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-accent" />
                      Recent Events
                    </h3>
                    <div className="space-y-3">
                      {recentActivity.events.slice(0, 10).map((event) => (
                        <div
                          key={event.id}
                          className="p-3 bg-accent/5 border border-accent/20 rounded-lg hover:bg-accent/10 transition-colors cursor-pointer"
                          onClick={() => navigate(`/events/${event.eventId}`)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-sm truncate">{event.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {event.tierCount} tiers
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.venue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
