import { getReviewQueue } from "@/actions/review";
import { ReviewList } from "./_components/review-list";

export const metadata = {
  title: "Review | paisa",
};

export default async function ReviewPage() {
  const items = await getReviewQueue();

  return (
    <div className="container mx-auto px-4 pb-16 pt-28">
      <header className="mb-8">
        <h1
          className="text-3xl font-bold text-white sm:text-4xl"
          style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
        >
          Review
        </h1>
        <p className="mt-2 max-w-2xl text-white/60">
          {items.length > 0
            ? `${items.length} auto-imported ${
                items.length === 1 ? "transaction needs" : "transactions need"
              } a quick check. Confirm the category, or delete anything that was never a real payment.`
            : "Auto-imported transactions land here when the parser is unsure."}
        </p>
      </header>

      <div className="max-w-3xl">
        <ReviewList initialItems={items} />
      </div>
    </div>
  );
}
