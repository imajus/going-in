import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download } from 'lucide-react';
import { useTicketingCore } from '@/hooks/useContract';
import { useAvailableRevenue, useInvalidateQueries } from '@/hooks/useEventData';
import { formatEther, parseEther } from 'ethers';
import { toast } from 'sonner';

interface RevenueWithdrawalProps {
  eventId: bigint;
  canWithdraw: boolean;
  organizerAddress: string;
}

const withdrawalSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be greater than 0',
    }),
});

type WithdrawalFormValues = z.infer<typeof withdrawalSchema>;

export function RevenueWithdrawal({ eventId, canWithdraw, organizerAddress }: RevenueWithdrawalProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const ticketingCore = useTicketingCore(true);
  const { data: availableRevenue = BigInt(0) } = useAvailableRevenue(eventId);
  const { invalidateEvent } = useInvalidateQueries();

  const availableRevenueFormatted = formatEther(availableRevenue);

  const form = useForm<WithdrawalFormValues>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: '',
    },
  });

  const handleWithdrawal = async (values: WithdrawalFormValues) => {
    setIsWithdrawing(true);

    try {
      // Parse the amount
      const amountBigInt = parseEther(values.amount);

      // Client-side validation: Check if amount <= available revenue
      if (amountBigInt > availableRevenue) {
        toast.error('Amount exceeds available revenue');
        setIsWithdrawing(false);
        return;
      }

      // Call withdrawRevenue function
      const tx = await ticketingCore.withdrawRevenue(eventId, amountBigInt);

      toast.loading(`Withdrawing revenue... Transaction: ${tx.hash.slice(0, 10)}...`, {
        id: tx.hash,
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      if (receipt?.status === 1) {
        toast.success(`Successfully withdrew ${values.amount} tokens!`, {
          id: tx.hash,
        });

        // Invalidate queries to refresh data
        invalidateEvent(eventId);

        // Reset form and close dialog
        form.reset();
        setDialogOpen(false);
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      console.error('Withdrawal error:', error);

      let errorMessage = 'Failed to withdraw revenue. Please try again.';

      if (error.message?.includes('before deadline')) {
        errorMessage = 'Cannot withdraw before the refund deadline has passed.';
      } else if (error.message?.includes('not organizer')) {
        errorMessage = 'Only the event organizer can withdraw revenue.';
      } else if (error.message?.includes('insufficient')) {
        errorMessage = 'Insufficient revenue available for withdrawal.';
      } else if (error.message?.includes('user rejected')) {
        errorMessage = 'Transaction was rejected.';
      }

      toast.error(errorMessage);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const setMaxAmount = () => {
    form.setValue('amount', availableRevenueFormatted);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="flex-1 shadow-glow" disabled={!canWithdraw || availableRevenue === BigInt(0)}>
          <Download className="mr-2 h-4 w-4" />
          Withdraw Revenue
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw Revenue</DialogTitle>
          <DialogDescription>
            Enter the amount you wish to withdraw from your available revenue.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Card className="p-4 bg-primary/10 border-primary/20 mb-4">
            <div className="text-sm text-muted-foreground mb-1">Available Revenue</div>
            <div className="text-3xl font-bold text-primary">{availableRevenueFormatted} Tokens</div>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleWithdrawal)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Withdrawal Amount</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input
                          placeholder="0.0"
                          type="number"
                          step="any"
                          {...field}
                          disabled={isWithdrawing}
                        />
                      </FormControl>
                      <Button type="button" variant="outline" onClick={setMaxAmount} disabled={isWithdrawing}>
                        Max
                      </Button>
                    </div>
                    <FormDescription>Enter amount in tokens (e.g., 100.5)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={isWithdrawing}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isWithdrawing} className="shadow-glow">
                  {isWithdrawing ? 'Processing...' : 'Confirm Withdrawal'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
