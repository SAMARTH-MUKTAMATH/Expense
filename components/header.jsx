import React from "react";
import { Button } from "./ui/button";
import { SparklesIcon } from "@/components/ui/sparkles";
import { SquarePenIcon } from "@/components/ui/square-pen";
import { LayoutGridIcon } from "@/components/ui/layout-grid";
import Link from "next/link";
import { Users } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";
import { HandCoinsIcon } from "@/components/ui/hand-coins";

const Header = async () => {
    await checkUser();

    return (
        <header className="fixed top-0 w-full z-50">
            <div className="glass-dark border-b border-white/10">
                <nav
                    className="container mx-auto px-4 py-3 flex items-center justify-between"
                    style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
                >
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-brand text-white bg-transparent transition-all group-hover:scale-105 group-hover:bg-brand/10">
                            <HandCoinsIcon size={20} />
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
                            <Link href="/dashboard">
                                <Button
                                    variant="outline"
                                    className="group gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                                >
                                    <LayoutGridIcon size={18} />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Button>
                            </Link>
                            <Link href="/groups">
                                <Button
                                    variant="outline"
                                    className="group gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                                >
                                    <Users size={18} />
                                    <span className="hidden sm:inline">Splitwise</span>
                                </Button>
                            </Link>
                            <Link href="/advisor">
                                <Button
                                    variant="outline"
                                    className="group gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                                >
                                    <SparklesIcon size={18} />
                                    <span className="hidden sm:inline">Financial Advice</span>
                                </Button>
                            </Link>
                            <Link href="/transaction/create">
                                <Button className="group gap-2 btn-primary">
                                    <SquarePenIcon size={18} />
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
                                    <SparklesIcon size={16} />
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
