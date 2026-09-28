import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { StoreProvider } from "@/lib/store/StoreProvider";
import { ToastProvider } from "@/components/toast/ToastProvider";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/lib/theme/ThemeProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AUXIO One | Care operations platform for NDIS providers",
  description:
    "Multi-tenant SaaS for NDIS providers — organisation setup, workforce onboarding, rostering, shift execution, and billing-ready handoff.",
  icons: {
    icon: "/images/auxio-logo.png",
    apple: "/images/auxio-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <StoreProvider>
            <ToastProvider>{children}</ToastProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
