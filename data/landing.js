import { ChartBarIncreasingIcon } from "@/components/ui/chart-bar-increasing";
import { ReceiptIcon } from "@/components/ui/receipt";
import { ChartPieIcon } from "@/components/ui/chart-pie";
import { CreditCardIcon } from "@/components/ui/credit-card";
import { BellIcon } from "@/components/ui/bell";
import { SparklesIcon } from "@/components/ui/sparkles";
import { UserRoundPlusIcon } from "@/components/ui/user-round-plus";
import { TrendingUpIcon } from "@/components/ui/trending-up";

export const statsData = [
  { value: "50K+", label: "Active users" },
  { value: "₹500Cr+", label: "Transactions tracked" },
  { value: "99.9%", label: "Uptime" },
  { value: "4.9/5", label: "User rating" },
];

export const featuresData = [
  {
    icon: <ChartBarIncreasingIcon size={24} />,
    title: "Advanced analytics",
    description:
      "Drill into your spending patterns with category-wise charts and AI-powered insights.",
  },
  {
    icon: <ReceiptIcon size={24} />,
    title: "Smart receipt scanner",
    description:
      "Snap a bill and Gemini AI extracts amount, date, and category automatically.",
  },
  {
    icon: <ChartPieIcon size={24} />,
    title: "Monthly budgets",
    description:
      "Set a budget per default account and get alerted when you cross 80% of it.",
  },
  {
    icon: <CreditCardIcon size={24} />,
    title: "Multi-account support",
    description:
      "Track savings and current accounts in one dashboard with a default account toggle.",
  },
  {
    icon: <BellIcon size={24} />,
    title: "Recurring transactions",
    description:
      "Auto-create daily, weekly, monthly, or yearly transactions so you never forget an EMI.",
  },
  {
    icon: <SparklesIcon size={24} />,
    title: "AI monthly reports",
    description:
      "Receive a friendly Gemini-written summary every month with three actionable tips.",
  },
];

export const howItWorksData = [
  {
    icon: <UserRoundPlusIcon size={28} />,
    title: "Create your account",
    description:
      "Sign up with Google or email in seconds. Your data is encrypted end-to-end.",
  },
  {
    icon: <ChartBarIncreasingIcon size={28} />,
    title: "Track your spending",
    description:
      "Add transactions manually or scan receipts. We categorise them in real time.",
  },
  {
    icon: <TrendingUpIcon size={28} />,
    title: "Get smarter every month",
    description:
      "AI-generated insights highlight savings opportunities and unusual spends.",
  },
];

export const testimonialsData = [
  {
    name: "Aarav Sharma",
    role: "Freelance designer, Bengaluru",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    quote:
      "Paisa replaced three different spreadsheets I was juggling. The receipt scanner alone saves me hours each month.",
  },
  {
    name: "Priya Iyer",
    role: "Small business owner, Mumbai",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    quote:
      "The monthly AI insights actually pointed out a recurring subscription I'd forgotten about. Cancelled it the same day.",
  },
  {
    name: "Rohit Verma",
    role: "Software engineer, Pune",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    quote:
      "Clean UI, ₹ everywhere by default, and budget alerts that aren't annoying. Exactly what I was looking for.",
  },
];
