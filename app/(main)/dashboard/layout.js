import { BarLoader } from "react-spinners";
import { Suspense } from "react";

export default function DashboardLayout({ children }) {
  return (
    <div className="px-4 md:px-8 py-10 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-xs font-bold uppercase tracking-wider text-[#89E900]">
          Overview
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          Dashboard
        </h1>
      </div>
      <Suspense
        fallback={<BarLoader className="mt-4" width={"100%"} color="#89E900" />}
      >
        {children}
      </Suspense>
    </div>
  );
}
