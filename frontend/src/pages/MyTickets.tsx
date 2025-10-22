import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, QrCode, RefreshCw, Ticket } from "lucide-react";

const TICKETS = [
  {
    id: 1,
    eventName: "Neon Dreams Festival",
    venue: "Arcology Arena",
    date: "2025-11-15T20:00:00",
    tier: "VIP Experience",
    tokenId: "12345",
    nftAddress: "0xVIP...NFT",
    price: "150",
    refundEligible: true,
    refundDeadline: "2025-11-14T08:00:00",
    status: "upcoming",
  },
  {
    id: 2,
    eventName: "Cyber Pulse Night",
    venue: "Digital Dome",
    date: "2025-11-22T22:00:00",
    tier: "General Admission",
    tokenId: "67890",
    nftAddress: "0xGEN...NFT",
    price: "35",
    refundEligible: true,
    refundDeadline: "2025-11-21T10:00:00",
    status: "upcoming",
  },
  {
    id: 3,
    eventName: "Summer Beats 2024",
    venue: "Beach Stage",
    date: "2024-08-20T18:00:00",
    tier: "Premium",
    tokenId: "11111",
    nftAddress: "0xPREM...NFT",
    price: "80",
    refundEligible: false,
    status: "past",
  },
];

export default function MyTickets() {
  const upcomingTickets = TICKETS.filter((t) => t.status === "upcoming");
  const pastTickets = TICKETS.filter((t) => t.status === "past");

  const TicketCard = ({ ticket }: { ticket: typeof TICKETS[0] }) => {
    const isRefundable =
      ticket.refundEligible &&
      ticket.refundDeadline &&
      new Date(ticket.refundDeadline) > new Date();

    return (
      <Card className="p-6 border-border/50 bg-card/50 backdrop-blur hover:border-primary/50 transition-all duration-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{ticket.tier}</Badge>
              <Badge className="bg-primary/20 text-primary">
                Token #{ticket.tokenId}
              </Badge>
            </div>
            <h3 className="text-2xl font-bold mb-2">{ticket.eventName}</h3>
            
            <div className="space-y-2 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(ticket.date).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{ticket.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                <span className="text-xs">NFT: {ticket.nftAddress}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="text-2xl font-bold text-primary">{ticket.price} USDC</div>
          </div>
        </div>

        {ticket.status === "upcoming" && (
          <>
            {isRefundable && (
              <div className="mb-4 p-3 bg-accent/10 border border-accent/20 rounded-md">
                <p className="text-sm text-muted-foreground">
                  Refund available until{" "}
                  {new Date(ticket.refundDeadline!).toLocaleString()}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button className="flex-1 shadow-glow">
                <QrCode className="mr-2 h-4 w-4" />
                Show QR Code
              </Button>
              {isRefundable && (
                <Button variant="outline" className="border-destructive/50 hover:bg-destructive/10">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Request Refund
                </Button>
              )}
            </div>
          </>
        )}

        {ticket.status === "past" && (
          <Badge variant="secondary" className="w-full justify-center py-2">
            Event Completed
          </Badge>
        )}
      </Card>
    );
  };

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

          <Tabs defaultValue="upcoming" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingTickets.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastTickets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4">
              {upcomingTickets.length > 0 ? (
                upcomingTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))
              ) : (
                <Card className="p-12 border-border/50 bg-card/50 backdrop-blur text-center">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-bold mb-2">No Upcoming Tickets</h3>
                  <p className="text-muted-foreground mb-6">
                    You don't have any tickets for upcoming events
                  </p>
                  <Button className="shadow-glow">Browse Events</Button>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-4">
              {pastTickets.length > 0 ? (
                pastTickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
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
        </div>
      </div>
    </div>
  );
}
