"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  const isActive = (path: string) => pathname === path;
  const ctaHref =
    pathname === "/contact" ? "#cta-form" :
    pathname === "/about" ? "/#about-cta" :
    pathname === "/" ? "#about-cta" :
    "#hero-form";

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 h-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/images/tbh_logo.webp"
            alt="Tarek Buys Houses"
            width={100}
            height={50}
            className="h-10 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-6">
          <Link
            href="/about"
            className={`text-sm font-semibold transition-colors ${
              isActive("/about")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            About Us
          </Link>
          <Link
            href="/contact"
            className={`text-sm font-semibold transition-colors ${
              isActive("/contact")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Contact
          </Link>
        </nav>

        <a
          href={ctaHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-sm flex-shrink-0 shadow-amber group"
        >
          Get Cash Offer <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </header>
  );
}
