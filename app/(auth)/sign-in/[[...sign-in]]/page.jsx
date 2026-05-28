"use client";

import { SignIn, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
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
        <SignIn
            fallbackRedirectUrl="/dashboard"
            signUpFallbackRedirectUrl="/dashboard"
        />
    );
}