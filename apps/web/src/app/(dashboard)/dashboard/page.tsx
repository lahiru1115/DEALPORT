import type { Metadata } from "next";

import { AddNewProductCard } from "@/components/dashboard/add-new-product-card";
import { BestSellingCard } from "@/components/dashboard/best-selling-card";
import { LiveUsersCard } from "@/components/dashboard/live-users-card";
import { ReportCard } from "@/components/dashboard/report-card";
import { StatCards } from "@/components/dashboard/stat-cards";
import { TopProductsCard } from "@/components/dashboard/top-products-card";
import { TransactionCard } from "@/components/dashboard/transaction-card";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const [stats, report, transactions, topProducts, bestSelling, categories] = await Promise.all([
    serverApi.dashboard.stats(),
    serverApi.dashboard.report("this-week"),
    serverApi.dashboard.transactions(5),
    serverApi.products.top(4),
    serverApi.products.bestSelling(4),
    serverApi.categories.list(),
  ]);

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCards stats={stats} />
      <ReportCard initialReport={report} />
      <LiveUsersCard />
      <TransactionCard transactions={transactions.data} />
      <TopProductsCard products={topProducts} />
      <BestSellingCard products={bestSelling} />
      <AddNewProductCard categories={categories.data} />
    </div>
  );
}
