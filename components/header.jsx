import React from "react";
import { Button } from "./ui/button";
import Link from "next/link";
import {
  Sparkles,
  SquarePen,
  LayoutGrid,
  Users,
  HandCoins,
  Settings,
  BellDot,
} from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import { db } from "@/lib/prisma";
import { MobileMenu } from "@/components/mobile-menu";
import { HelpButton } from "@/components/help-button";

const Header = async () => {
    const user = await checkUser();

    let reviewCount = 0;
    try {
        if (user) {
            reviewCount = await db.transaction.count({
                where: { userId: user.id, needsReview: true },
            });
        }
    } catch {}

    return (
        <header className="fixed top-0 w-full z-50">
            <div className="glass-dark border-b border-white/10">
                <nav
                    className="container mx-auto px-4 py-3 flex items-center justify-between"
                    style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
                >
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-brand text-white bg-transparent transition-all group-hover:scale-105 group-hover:bg-brand/10">
                            <HandCoins size={20} />
                        </span>
                        <span className="text-xl font-bold tracking-tight text-white">
                            <span className="font-extrabold">Budget</span>
                            <span className="font-extrabold text-brand">FLOW</span>
                        </span>
                    </Link>

                    <div
                        className="hidden md:flex items-center gap-7"
                        suppressHydrationWarning
                    >
                        <Show when="signed-out">
                            <a
                                href="#features"
                                className="text-sm text-gray-400 hover:text-[#89E900] transition-colors"
                            >
                                Features
                            </a>
                            <a
                                href="#how-it-works"
                                className="text-sm text-gray-400 hover:text-[#89E900] transition-colors"
                            >
                                How it works
                            </a>
                            <a
                                href="#testimonials"
                                className="text-sm text-gray-400 hover:text-[#89E900] transition-colors"
                            >
                                Testimonials
                            </a>
                        </Show>
                    </div>

                    <div
                        className="flex items-center gap-2 sm:gap-3"
                        suppressHydrationWarning
                    >
                        <Show when="signed-in">
                            {/* Mobile: single Menu dropdown collapsing the 3 secondary nav links */}
                            <div className="sm:hidden">
                                <MobileMenu />
                            </div>

                            {/* sm+ : show the 3 nav buttons inline */}
                            <Link href="/dashboard" className="hidden sm:inline-flex">
                                <Button
                                    variant="outline"
                                    className="group gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                                >
                                    <LayoutGrid size={18} />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Button>
                            </Link>
                            <Link href="/groups" className="hidden sm:inline-flex">
                                <Button
                                    variant="outline"
                                    className="group gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                                >
                                    <Users size={18} />
                                    <span className="hidden sm:inline">Splitwise</span>
                                </Button>
                            </Link>
                            <Link href="/advisor" className="hidden sm:inline-flex">
                                <Button
                                    variant="outline"
                                    className="group gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                                >
                                    <Sparkles size={18} />
                                    <span className="hidden sm:inline">Financial Advice</span>
                                </Button>
                            </Link>

                            {/* Only rendered when there is something to review,
                                so it reads as a notification rather than
                                permanent furniture. */}
                            {reviewCount > 0 && (
                                <Link href="/review" className="inline-flex">
                                    <Button
                                        variant="outline"
                                        className="group gap-2 border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20 hover:text-amber-100"
                                    >
                                        <BellDot size={18} />
                                        <span className="hidden sm:inline">Review</span>
                                        <span className="rounded-full bg-amber-400/25 px-2 text-xs font-semibold">
                                            {reviewCount}
                                        </span>
                                    </Button>
                                </Link>
                            )}

                            {/* Icon only: low-frequency page, and the nav is
                                already carrying three labelled buttons. */}
                            <Link href="/settings" className="hidden sm:inline-flex">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    aria-label="Settings"
                                    className="bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                                >
                                    <Settings size={18} />
                                </Button>
                            </Link>

                            {/* Help / tour — re-opens the onboarding carousel */}
                            <HelpButton />

                            {/* Always visible: Add Transaction (icon-only on mobile) */}
                            <Link href="/transaction/create">
                                <Button className="group gap-2 btn-primary">
                                    <SquarePen size={18} />
                                    <span className="hidden sm:inline">Add Transaction</span>
                                </Button>
                            </Link>
                        </Show>
                        <Show when="signed-out">
                            <SignInButton forceRedirectUrl="/dashboard">
                                <Button
                                    variant="ghost"
                                    className="hidden sm:inline-flex text-white hover:bg-white/5 hover:text-white"
                                >
                                    Sign in
                                </Button>
                            </SignInButton>
                            <SignInButton forceRedirectUrl="/dashboard">
                                <Button className="gap-2 btn-primary">
                                    <Sparkles size={16} />
                                    Get Started
                                </Button>
                            </SignInButton>
                        </Show>
                        <Show when="signed-in">
                            <span suppressHydrationWarning>
                                <UserButton
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-9 h-9 ring-2 ring-[#89E900]",
                                        },
                                    }}
                                />
                            </span>
                        </Show>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;
