// OnboardingTour is now mounted in the root layout (app/layout.js) so the
// navbar Help button works on every page, including the landing page. This
// layout is kept as a passthrough in case we add (main)-wide UI later.
export default function MainLayout({ children }) {
  return <>{children}</>;
}
