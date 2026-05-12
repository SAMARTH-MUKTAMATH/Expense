"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";

/**
 * Renders an animated Lottie icon from /public/lottie/<name>.json.
 * Usage: <LottieIcon name="sparkle" className="h-6 w-6" />
 *
 * Drop additional .json files into public/lottie/ to add more icons.
 * Source free animations from https://lottiefiles.com/free-animation-search.
 */
export function LottieIcon({ name, className, loop = true, autoplay = true }) {
    const [data, setData] = useState(null);

    useEffect(() => {
        let cancelled = false;
        fetch(`/lottie/${name}.json`)
            .then((r) => r.json())
            .then((json) => {
                if (!cancelled) setData(json);
            })
            .catch(() => {
                if (!cancelled) setData(null);
            });
        return () => {
            cancelled = true;
        };
    }, [name]);

    if (!data) {
        return <span className={className} />;
    }

    return (
        <div className={className}>
            <Lottie animationData={data} loop={loop} autoplay={autoplay} />
        </div>
    );
}
