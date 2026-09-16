"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { navLinks, site } from "@/lib/content";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition duration-300 ${
        scrolled
          ? "border-b border-border/80 bg-background/85 backdrop-blur-md"
          : "bg-transparent"
      }`}
    >
      <div className="section-shell flex h-16 items-center justify-between py-4">
        <Link href="/" className="group flex items-center gap-3">
          <BrandLogo
            size={40}
            priority
            className="h-10 w-10 object-contain transition group-hover:scale-105"
          />
          <span className="text-lg font-semibold tracking-tight">{site.name}</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted transition hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button href="/login" variant="ghost" className="hidden px-4 py-2.5 sm:inline-flex">
            Sign in
          </Button>
          <Button href="/get-started" className="px-5 py-2.5">
            Book a Demo
          </Button>
        </div>
      </div>
    </header>
  );
}
