import { FilterIcon } from "lucide-react";
import type { Transaction } from "@dealport/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_TONE = {
  PAID: "success",
  PENDING: "pending",
  CANCELED: "error",
} as const;

const STATUS_LABEL = {
  PAID: "Paid",
  PENDING: "Pending",
  CANCELED: "Canceled",
} as const;

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  const day = date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${day} | ${time}`;
}

export function TransactionCard({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="col-span-3 lg:col-span-2">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-title text-cyprus">Transaction</h3>
        {/* No filter behaviour is defined for the dashboard in scope — visual only. */}
        <Button size="sm" className="rounded-full">
          Filter
          <FilterIcon className="size-4" />
        </Button>
      </div>

      <Table>
        <TableHeader variant="plain">
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Id Customer</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction, index) => (
            <TableRow key={transaction.id}>
              <TableCell className="text-grey">{index + 1}.</TableCell>
              <TableCell className="text-cyprus">{transaction.reference}</TableCell>
              <TableCell className="text-cyprus">{formatOrderDate(transaction.placedAt)}</TableCell>
              <TableCell>
                <StatusPill tone={STATUS_TONE[transaction.status]}>
                  {STATUS_LABEL[transaction.status]}
                </StatusPill>
              </TableCell>
              <TableCell className="text-right font-bold text-cyprus">
                ${transaction.amount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
