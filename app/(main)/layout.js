import { TrackingPrompt } from "@/components/tracking-prompt";

export default function MainLayout({ children }) {
  return (
    <>
      {children}
      <TrackingPrompt />
    </>
  );
}
