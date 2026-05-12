"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/arrow-right";
import { ArrowDownRightIcon } from "@/components/ui/arrow-down-right";
import { ArrowUpRightIcon } from "@/components/ui/arrow-up-right";
import { ShieldCheckIcon } from "@/components/ui/shield-check";
import { SparklesIcon } from "@/components/ui/sparkles";
import { WalletIcon } from "@/components/ui/wallet";
import { ReceiptIcon } from "@/components/ui/receipt";
import { ScanTextIcon } from "@/components/ui/scan-text";
import { CircleCheckIcon } from "@/components/ui/circle-check";
import { BellIcon } from "@/components/ui/bell";
import { TrendingUpIcon } from "@/components/ui/trending-up";
import { ChartPieIcon } from "@/components/ui/chart-pie";

const HeroSection = () => {
    const imageRef = useRef(null);

    useEffect(() => {
        const imageElement = imageRef.current;
        const handleScroll = () => {
            if (window.scrollY > 100) {
                imageElement?.classList.add("scrolled");
            } else {
                imageElement?.classList.remove("scrolled");
            }
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section className="relative pt-12 pb-16 px-4">
            {/* Outer lime glow halos — bleed lime into the dark page bg around the panel corners */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-0">
                <div className="absolute top-0 left-1/4 h-[28rem] w-[28rem] rounded-full bg-[#89E900]/20 blur-3xl animate-float-slow" />
                <div className="absolute top-1/3 right-0 h-[24rem] w-[24rem] rounded-full bg-[#89E900]/15 blur-3xl animate-float" />
                <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#89E900]/12 blur-3xl" />
            </div>

            {/* Lime main bg panel — multi-stop gradient */}
            <div
                className="relative mx-auto max-w-7xl rounded-[2rem] panel-lime overflow-hidden"
                style={{ boxShadow: "0 30px 80px -20px rgba(137,233,0,0.55), 0 0 0 1px rgba(137,233,0,0.3), 0 0 120px 0 rgba(137,233,0,0.2)" }}
            >
                {/* decorative grid */}
                <div
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.08)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
                />
                {/* inner corner gradients — darker pools at the corners for depth */}
                <div
                    aria-hidden
                    className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#0a0a0a]/15 blur-3xl"
                />
                <div
                    aria-hidden
                    className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-white/20 blur-3xl"
                />
                {/* lime-to-transparent inner fade at the top/bottom edges */}
                <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#a3ff19]/40 to-transparent"
                />
                <div
                    aria-hidden
                    className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#6BB300]/30 to-transparent"
                />

                <div className="relative px-6 sm:px-10 md:px-16 pt-16 md:pt-20 pb-20 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-[#0a0a0a] px-3 py-1 text-xs font-semibold text-[#89E900] shadow-md shadow-black/30 mb-8 animate-fade-up">
                        <SparklesIcon size={14} />
                        Smart finance, made for India
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-[88px] leading-[1.05] pb-4 font-extrabold tracking-tighter text-[#0a0a0a] animate-fade-up">
                        Manage your money <br />
                        with intelligence.
                    </h1>

                    <p className="text-base md:text-lg text-[#0a0a0a]/75 mb-10 max-w-2xl mx-auto animate-fade-up [animation-delay:120ms]">
                        Paisa is your AI-powered finance companion. Scan receipts, track
                        spending in ₹, set budgets, and get personalised monthly
                        insights — all in one place.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up [animation-delay:200ms]">
                        <Link href="/dashboard">
                            <Button
                                size="lg"
                                className="px-8 gap-2 bg-[#0a0a0a] text-[#89E900] hover:bg-[#161616] shadow-lg shadow-black/40 font-semibold"
                            >
                                Get started free
                                <ArrowRightIcon size={16} />
                            </Button>
                        </Link>
                        <a href="#features">
                            <Button
                                size="lg"
                                variant="outline"
                                className="px-8 bg-transparent border-[#0a0a0a]/40 text-[#0a0a0a] hover:bg-[#0a0a0a]/5 hover:text-[#0a0a0a]"
                            >
                                See features
                            </Button>
                        </a>
                    </div>

                    <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[#0a0a0a]/70 animate-fade-up [animation-delay:280ms]">
                        <ShieldCheckIcon size={14} />
                        No credit card required · Secure bank-grade encryption
                    </div>

                    <div className="hero-image-wrapper mt-16 md:mt-20 relative">
                        <div ref={imageRef} className="hero-image relative">
                            <div
                                aria-hidden
                                className="absolute -inset-4 rounded-3xl bg-black/40 blur-3xl"
                            />
                            <DashboardPreview />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

function DashboardPreview() {
    return (
        <div className="relative mx-auto max-w-5xl">
            {/* Floating receipt scanner card - top left */}
            <div className="hidden md:block absolute -top-10 -left-6 lg:-left-12 z-20 animate-float-slow">
                <div className="rounded-2xl bg-[#161616] border border-white/10 shadow-2xl shadow-black/50 p-4 w-64 rotate-[-4deg] hover:rotate-0 transition-transform">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-9 w-9 rounded-xl bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/40 icon-glow">
                            <ScanTextIcon size={16} className="icon-hover" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-semibold text-white">Receipt scanned</p>
                            <p className="text-[10px] text-gray-400">Gemini AI · 1.2s</p>
                        </div>
                        <CircleCheckIcon size={16} className="text-emerald-400" />
                    </div>
                    <div className="space-y-1.5 rounded-lg bg-[#0a0a0a] border border-white/5 p-2.5">
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400">Merchant</span>
                            <span className="font-medium text-white">Big Bazaar</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400">Amount</span>
                            <span className="font-bold text-red-400">₹2,847</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                            <span className="text-gray-400">Category</span>
                            <span className="font-medium capitalize text-white">
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#89E900] mr-1" />
                                groceries
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating AI insight card - bottom right */}
            <div className="hidden md:block absolute -bottom-12 -right-6 lg:-right-12 z-20 animate-float">
                <div className="rounded-2xl bg-[#161616] border border-white/10 shadow-2xl shadow-black/50 p-4 w-72 rotate-[3deg] hover:rotate-0 transition-transform">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-9 w-9 rounded-xl bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/40 icon-glow">
                            <SparklesIcon size={18} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-white">AI insight</p>
                            <p className="text-[10px] text-gray-400">For October</p>
                        </div>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                        You spent <span className="font-semibold text-white">28% less</span>{" "}
                        on food delivery this month — about{" "}
                        <span className="font-semibold text-emerald-400">₹3,400 saved</span>.
                        Keep it up!
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                        <TrendingUpIcon size={12} />
                        Trending in the right direction
                    </div>
                </div>
            </div>

            {/* Budget alert pill - top right */}
            <div className="hidden lg:flex absolute top-8 -right-2 z-20 animate-float-slow [animation-delay:1s]">
                <div className="flex items-center gap-2 rounded-full bg-[#161616] border border-white/10 shadow-xl px-3 py-2 rotate-[4deg]">
                    <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <BellIcon size={12} className="text-amber-400" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-semibold leading-none text-white">
                            Budget at 78%
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">HDFC Savings</p>
                    </div>
                </div>
            </div>

            {/* Main dashboard mock - dark */}
            <div className="relative rounded-2xl bg-[#0a0a0a] border border-white/10 shadow-2xl shadow-black/60 overflow-hidden text-left z-10">
                {/* Browser chrome */}
                <div className="flex items-center gap-1.5 border-b border-white/10 bg-[#161616] px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                    <div className="mx-auto flex items-center gap-1.5 rounded-md bg-[#0a0a0a] border border-white/10 px-2.5 py-1 text-[10px] text-gray-400">
                        <ShieldCheckIcon size={12} className="text-[#89E900]" />
                        paisa.app/dashboard
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {/* Header */}
                    <div className="mb-5 flex items-end justify-between">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#89E900]">
                                Overview
                            </p>
                            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
                                Dashboard
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-7 px-2.5 rounded-md bg-[#89E900] text-[#0a0a0a] text-[10px] font-semibold flex items-center gap-1 shadow-md shadow-[#89E900]/30">
                                <SparklesIcon size={14} />
                                Add transaction
                            </div>
                            <div className="h-8 w-8 rounded-full bg-[#89E900] ring-2 ring-[#89E900]/40" />
                        </div>
                    </div>

                    {/* Budget card */}
                    <div className="mb-4 rounded-xl border border-white/10 bg-[#161616] p-4 relative overflow-hidden">
                        <div
                            aria-hidden
                            className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#89E900]/20 blur-2xl"
                        />
                        <div className="relative flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="h-9 w-9 rounded-lg bg-[#89E900] text-[#0a0a0a] flex items-center justify-center shadow-md shadow-[#89E900]/30">
                                    <ChartPieIcon size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-white">
                                        Monthly budget
                                    </p>
                                    <p className="text-[10px] text-gray-400">
                                        <span className="font-medium text-gray-200">₹38,400</span>{" "}
                                        of ₹60,000 spent
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400">Remaining</p>
                                <p className="text-lg font-extrabold text-[#89E900]">
                                    ₹21,600
                                </p>
                            </div>
                        </div>
                        <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                            <div
                                className="h-full bg-gradient-to-r from-amber-400 to-orange-500"
                                style={{ width: "64%" }}
                            />
                        </div>
                        <div className="flex justify-between mt-1.5 text-[10px]">
                            <span className="text-gray-400">On track</span>
                            <span className="font-medium text-gray-300">64% used</span>
                        </div>
                    </div>

                    {/* Chart + Recent */}
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4">
                        <div className="sm:col-span-3 rounded-xl border border-white/10 bg-[#161616] p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="h-7 w-7 rounded-lg bg-[#89E900] text-[#0a0a0a] flex items-center justify-center">
                                        <TrendingUpIcon size={14} />
                                    </div>
                                    <p className="text-xs font-semibold text-white">
                                        Transaction overview
                                    </p>
                                </div>
                                <span className="rounded-md border border-white/10 bg-[#0a0a0a] px-2 py-0.5 text-[10px] text-gray-400">
                                    30 days
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 text-center">
                                    <p className="text-[9px] text-gray-400">Income</p>
                                    <p className="text-xs font-bold text-emerald-400">
                                        ₹84,000
                                    </p>
                                </div>
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-2 py-1.5 text-center">
                                    <p className="text-[9px] text-gray-400">Expense</p>
                                    <p className="text-xs font-bold text-red-400">₹38,400</p>
                                </div>
                                <div className="rounded-lg bg-[#89E900]/10 border border-[#89E900]/20 px-2 py-1.5 text-center">
                                    <p className="text-[9px] text-gray-400">Net</p>
                                    <p className="text-xs font-bold text-[#89E900]">
                                        ₹45,600
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-end gap-1.5 h-24">
                                {[
                                    { i: 70, e: 30 },
                                    { i: 45, e: 55 },
                                    { i: 90, e: 25 },
                                    { i: 60, e: 40 },
                                    { i: 80, e: 50 },
                                    { i: 55, e: 35 },
                                    { i: 75, e: 45 },
                                    { i: 95, e: 60 },
                                    { i: 65, e: 30 },
                                    { i: 85, e: 50 },
                                    { i: 50, e: 70 },
                                    { i: 78, e: 42 },
                                ].map((bar, idx) => (
                                    <div
                                        key={idx}
                                        className="flex-1 flex flex-col gap-0.5 justify-end"
                                    >
                                        <div
                                            className="rounded-sm bg-emerald-500"
                                            style={{ height: `${bar.i}%` }}
                                        />
                                        <div
                                            className="rounded-sm bg-red-500"
                                            style={{ height: `${bar.e}%` }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sm:col-span-2 rounded-xl border border-white/10 bg-[#161616] p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-7 w-7 rounded-lg bg-[#89E900] text-[#0a0a0a] flex items-center justify-center">
                                    <ReceiptIcon size={14} />
                                </div>
                                <p className="text-xs font-semibold text-white">Recent</p>
                            </div>
                            <div className="space-y-2">
                                {[
                                    {
                                        name: "Swiggy",
                                        date: "Today",
                                        amount: -420,
                                        type: "EXPENSE",
                                    },
                                    {
                                        name: "Freelance",
                                        date: "2d ago",
                                        amount: 25000,
                                        type: "INCOME",
                                    },
                                    {
                                        name: "Electricity bill",
                                        date: "5d ago",
                                        amount: -1840,
                                        type: "EXPENSE",
                                    },
                                    {
                                        name: "Zomato",
                                        date: "1w ago",
                                        amount: -680,
                                        type: "EXPENSE",
                                    },
                                ].map((t, idx) => (
                                    <div key={idx} className="flex items-center gap-2.5">
                                        <div
                                            className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                                                t.type === "EXPENSE"
                                                    ? "bg-red-500/15 text-red-400"
                                                    : "bg-emerald-500/15 text-emerald-400"
                                            }`}
                                        >
                                            {t.type === "EXPENSE" ? (
                                                <ArrowDownRightIcon size={14} />
                                            ) : (
                                                <ArrowUpRightIcon size={14} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-medium truncate text-white">
                                                {t.name}
                                            </p>
                                            <p className="text-[9px] text-gray-400">{t.date}</p>
                                        </div>
                                        <p
                                            className={`text-[11px] font-semibold shrink-0 ${
                                                t.type === "EXPENSE"
                                                    ? "text-red-400"
                                                    : "text-emerald-400"
                                            }`}
                                        >
                                            {t.type === "EXPENSE" ? "-" : "+"}₹
                                            {Math.abs(t.amount).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Account cards */}
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            {
                                name: "HDFC Savings",
                                type: "Savings",
                                balance: "₹1,24,580",
                                bg: "bg-[#89E900]",
                                fg: "text-white",
                                isDefault: true,
                            },
                            {
                                name: "Axis Current",
                                type: "Current",
                                balance: "₹48,920",
                                bg: "bg-white/10",
                                fg: "text-[#89E900]",
                            },
                            {
                                name: "Paytm Wallet",
                                type: "Wallet",
                                balance: "₹3,420",
                                bg: "bg-white/10",
                                fg: "text-[#89E900]",
                            },
                        ].map((a, idx) => (
                            <div
                                key={idx}
                                className="relative overflow-hidden rounded-xl border border-white/10 bg-[#161616] p-3"
                            >
                                <div className="relative flex items-center gap-2 mb-2">
                                    <div
                                        className={`h-7 w-7 rounded-lg flex items-center justify-center ${a.bg} ${a.fg}`}
                                    >
                                        <WalletIcon size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-semibold truncate leading-tight text-white">
                                            {a.name}
                                        </p>
                                        <p className="text-[9px] text-gray-400">{a.type}</p>
                                    </div>
                                    {a.isDefault && (
                                        <span className="text-[8px] font-bold text-[#0a0a0a] bg-[#89E900] px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="relative text-base font-extrabold tracking-tight text-white">
                                    {a.balance}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default HeroSection;
