import { getUserAccounts, getDashboardData } from "@/actions/dashboard";
import { getCurrentBudget } from "@/actions/budget";
import { AccountCard } from "./_components/account-card";
import { CreateAccountDrawer } from "@/components/create-account-drawer";
import { BudgetProgress } from "./_components/budget-progress";
import { Card, CardContent } from "@/components/ui/card";
import { Plus as PlusIcon } from "lucide-react";
import { DashboardOverview } from "./_components/transaction-overview";

export default async function DashboardPage() {
  const [accounts, transactions] = await Promise.all([
    getUserAccounts(),
    getDashboardData(),
  ]);

  const defaultAccount = accounts?.find((account) => account.isDefault);

  let budgetData = null;
  if (defaultAccount) {
    budgetData = await getCurrentBudget(defaultAccount.id);
  }

  return (
    <div className="space-y-8">
      <BudgetProgress
        initialBudget={budgetData?.budget}
        currentExpenses={budgetData?.currentExpenses || 0}
      />

      <DashboardOverview
        accounts={accounts}
        transactions={transactions || []}
      />

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Your accounts</h2>
          <span className="text-sm text-gray-400">
            {accounts?.length || 0} total
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <CreateAccountDrawer>
            <Card className="group cursor-pointer border-dashed border-2 border-white/15 bg-[#161616] hover:border-[#89E900] hover:bg-[#89E900]/5 transition-all">
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[160px] pt-5">
                <div className="h-12 w-12 rounded-full bg-[#89E900]/15 group-hover:bg-[#89E900]/30 flex items-center justify-center mb-3 transition-colors">
                  <PlusIcon size={24} className="text-[#89E900]" />
                </div>
                <p className="text-sm font-medium text-white">
                  Add new account
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Track another bank or wallet
                </p>
              </CardContent>
            </Card>
          </CreateAccountDrawer>
          {accounts?.length > 0 &&
            accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
        </div>
      </div>
    </div>
  );
}
