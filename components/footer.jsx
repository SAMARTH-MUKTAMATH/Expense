import Link from "next/link";
import { GithubIcon } from "@/components/ui/github";
import { LinkedinIcon } from "@/components/ui/linkedin";
import { TwitterIcon } from "@/components/ui/twitter";
import { HandCoinsIcon } from "@/components/ui/hand-coins";

const Footer = () => {
    return (
        <footer className="mt-20 border-t border-white/10 bg-[#0a0a0a]">
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-brand text-white bg-transparent">
                                <HandCoinsIcon size={20} />
                            </span>
                            <span
                                className="text-lg font-bold tracking-tight text-white"
                                style={{ fontFamily: "var(--font-intro), system-ui, sans-serif" }}
                            >
                                <span className="font-extrabold">Budget</span>
                                <span className="font-extrabold text-brand">FLOW</span>
                            </span>
                        </Link>
                        <p className="text-sm text-gray-400 max-w-xs">
                            Your AI-powered finance companion. Track every rupee, smarter.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Product</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <a href="#features" className="hover:text-[#89E900]">
                                    Features
                                </a>
                            </li>
                            <li>
                                <a href="#how-it-works" className="hover:text-[#89E900]">
                                    How it works
                                </a>
                            </li>
                            <li>
                                <Link href="/dashboard" className="hover:text-[#89E900]">
                                    Dashboard
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/transaction/create"
                                    className="hover:text-[#89E900]"
                                >
                                    Add transaction
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>
                                <a href="#testimonials" className="hover:text-[#89E900]">
                                    Testimonials
                                </a>
                            </li>
                            <li>
                                <a
                                    href="https://github.com/SAMARTH-MUKTAMATH"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-[#89E900]"
                                >
                                    GitHub
                                </a>
                            </li>
                            <li>
                                <a
                                    href="mailto:hello@paisa.app"
                                    className="hover:text-[#89E900]"
                                >
                                    Contact
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Connect</h4>
                        <div className="flex items-center gap-3">
                            <a
                                href="https://github.com/SAMARTH-MUKTAMATH"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-300 hover:text-[#89E900] hover:border-[#89E900]/40 transition-colors"
                                aria-label="GitHub"
                            >
                                <GithubIcon size={16} />
                            </a>
                            <a
                                href="#"
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-300 hover:text-[#89E900] hover:border-[#89E900]/40 transition-colors"
                                aria-label="Twitter"
                            >
                                <TwitterIcon size={16} />
                            </a>
                            <a
                                href="#"
                                className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 flex items-center justify-center text-gray-300 hover:text-[#89E900] hover:border-[#89E900]/40 transition-colors"
                                aria-label="LinkedIn"
                            >
                                <LinkedinIcon size={16} />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
                    <p>© {new Date().getFullYear()} BudgetFLOW. All rights reserved.</p>
                    <p>
                        Made with 💗 by{" "}
                        <a
                            href="https://github.com/SAMARTH-MUKTAMATH"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#89E900] hover:underline font-medium"
                        >
                            Samarth Muktamath
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
