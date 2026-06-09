import { Suspense } from "react";
import { getAccountWithTransactions } from "@/actions/account";
import { BarLoader } from "react-spinners";
import { TransactionTable } from "../_components/transaction-table";
import { notFound } from "next/navigation";
import { AccountChart } from "../_components/account-chart";
import { formatINR } from "@/lib/utils";
import { Wallet as WalletIcon } from "lucide-react";

export default async function AccountPage({ params }) {
  const { id } = await params;
  const accountData = await getAccountWithTransactions(id);

  if (!accountData) {
    notFound();
  }

  const { transactions, ...account } = accountData;

  return (
    <div className="space-y-8 px-4 md:px-8 py-10 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#161616] p-6 md:p-8">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full blur-3xl bg-[#89E900]/20"
        />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-[#89E900] text-[#0a0a0a] shadow-lg shadow-[#89E900]/30">
              <WalletIcon size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#89E900]">
                {account.type.charAt(0) + account.type.slice(1).toLowerCase()}{" "}
                account
              </p>
              <h1 className="text-2xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.15] py-1 text-white capitalize break-words">
                {account.name}
              </h1>
            </div>
          </div>

          <div className="text-left md:text-right">
            <p className="text-xs text-gray-400">Current balance</p>
            <div className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              {formatINR(account.balance)}
            </div>
            <p className="text-sm text-gray-400 mt-1">
              {account._count.transactions} transactions
            </p>
          </div>
        </div>
      </div>

      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#89E900" />}
      >
        <AccountChart transactions={transactions} />
      </Suspense>

      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#89E900" />}
      >
        <TransactionTable transactions={transactions} />
      </Suspense>
    </div>
  );
}
