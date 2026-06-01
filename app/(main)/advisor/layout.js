import { BarLoader } from "react-spinners";
import { Suspense } from "react";

export default function AdvisorLayout({ children }) {
  return (
    <div className="px-4 md:px-8 py-10 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#89E900]">
          AI-powered
        </p>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Financial Advice
        </h1>
        <p className="text-sm md:text-base text-gray-400 max-w-2xl">
          Comprehensive monthly intelligence reports — health score, expense
          analysis, forecasts, savings opportunities, and a 12-month action
          plan, grounded entirely in your real data.
        </p>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#89E900" />}
      >
        {children}
      </Suspense>
    </div>
  );
}
