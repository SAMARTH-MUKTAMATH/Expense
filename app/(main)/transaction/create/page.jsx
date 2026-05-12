import { getUserAccounts } from "@/actions/dashboard";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/transaction-form";
import { getTransaction } from "@/actions/transaction";

export default async function AddTransactionPage({ searchParams }) {
  const accounts = await getUserAccounts();
  const resolvedParams = await searchParams;
  const editId = resolvedParams?.edit;

  let initialData = null;
  if (editId) {
    initialData = await getTransaction(editId);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10">
      <div className="mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#89E900]">
          {editId ? "Edit" : "Create"}
        </p>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          {editId ? "Edit transaction" : "Add transaction"}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          {editId
            ? "Update the details of your transaction."
            : "Scan a receipt or fill in the details below."}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#161616] p-6 md:p-8">
        <AddTransactionForm
          accounts={accounts}
          categories={defaultCategories}
          editMode={!!editId}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
