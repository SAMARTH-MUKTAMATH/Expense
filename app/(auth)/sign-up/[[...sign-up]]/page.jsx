"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignUpPage() {
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            router.replace("/dashboard");
        }
    }, [isLoaded, isSignedIn, router]);

    if (isLoaded && isSignedIn) {
        return (
            <div className="text-center text-gray-300 py-20">
                Redirecting to your dashboard…
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center pt-40 pb-16">
            <SignUp
                fallbackRedirectUrl="/dashboard"
                signInFallbackRedirectUrl="/dashboard"
            />
        </div>
    );
}
