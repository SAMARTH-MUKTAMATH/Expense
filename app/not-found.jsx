import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home as HomeIcon, ArrowLeft as ArrowLeftIcon } from "lucide-react";

export default function NotFound() {
    return (
        <div className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center overflow-hidden">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-[#89E900]/15 blur-3xl animate-float-slow" />
                <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-[#89E900]/10 blur-3xl animate-float" />
            </div>

            <p className="text-xs font-bold uppercase tracking-wider text-[#89E900] mb-3">
                Error 404
            </p>
            <h1 className="text-8xl md:text-9xl font-extrabold text-white mb-2 leading-none">
                <span className="text-[#89E900]">4</span>0
                <span className="text-[#89E900]">4</span>
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">
                Page not found
            </h2>
            <p className="text-gray-400 mb-8 max-w-md">
                The page you&rsquo;re looking for doesn&rsquo;t exist or has been
                moved. Let&rsquo;s get you back on track.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/">
                    <Button className="gap-2 btn-primary">
                        <HomeIcon size={16} />
                        Return home
                    </Button>
                </Link>
                <Link href="/dashboard">
                    <Button
                        variant="outline"
                        className="gap-2 bg-transparent border-white/15 text-white hover:bg-white/5 hover:text-white"
                    >
                        <ArrowLeftIcon size={16} />
                        Go to dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
