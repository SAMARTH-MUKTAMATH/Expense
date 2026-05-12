import React from "react";
import { Button } from "./ui/button";
import { SparklesIcon } from "@/components/ui/sparkles";
import { SquarePenIcon } from "@/components/ui/square-pen";
import { LayoutGridIcon } from "@/components/ui/layout-grid";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/checkUser";

const Header = async () => {
    await checkUser();

    return (
        <header className="fixed top-0 w-full z-50">
            <div className="glass-dark border-b border-white/10">
                <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#89E900] text-[#0a0a0a] shadow-md shadow-[#89E900]/30 transition-transform group-hover:scale-105">
                            <span className="text-lg font-bold">₹</span>
                        </span>
                        <span className="text-xl font-extrabold tracking-tight text-white">
                            Paisa
                        </span>
                    </Link>

                    <div className="hidden md:flex items-center gap-7">
                        <SignedOut>
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
                        </SignedOut>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <SignedIn>
                            <Link href="/dashboard">
                                <Button
                                    variant="outline"
                                    className="group gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                                >
                                    <LayoutGridIcon size={18} />
                                    <span className="hidden sm:inline">Dashboard</span>
                                </Button>
                            </Link>
                            <Link href="/transaction/create">
                                <Button className="group gap-2 btn-primary">
                                    <SquarePenIcon size={18} />
                                    <span className="hidden sm:inline">Add Transaction</span>
                                </Button>
                            </Link>
                        </SignedIn>
                        <SignedOut>
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
                        </SignedOut>
                        <SignedIn>
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-9 h-9 ring-2 ring-[#89E900]",
                                    },
                                }}
                            />
                        </SignedIn>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;
