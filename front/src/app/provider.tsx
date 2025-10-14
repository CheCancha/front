"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import OneSignalProvider from "@/shared/components/providers/OneSignalProvider";

interface ProvidersProps {
    children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
    return (
        <SessionProvider>
            <OneSignalProvider>
                {children}
            </OneSignalProvider>
        </SessionProvider>
    );
}