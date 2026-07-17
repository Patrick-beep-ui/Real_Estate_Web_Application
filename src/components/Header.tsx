"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation"; 
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname.startsWith("/admin")) return null;

  const isActive = (path: string) => pathname === path;
  
  const ctaHref =
    pathname === "/contact" ? "#cta-form" :
    pathname === "/about" ? "/#about-cta" :
    pathname === "/" ? "#about-cta" :
    pathname.startsWith("/blog") ? "#final-cta" :
    "/#cta-form";

  return (
    <header className={`fixed top-0 w-full z-50 h-16 transition-colors duration-300 ${scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-shrink-0">
          <Link href="/">
            <Image
              src="/images/tbh_logo_white.webp"
              alt="Tarek Buys Houses"
              width={100}
              height={50}
              className="h-8 w-auto"
            />
          </Link>
          {pathname.startsWith("/blog") && (
            <>
              <span className="text-border text-lg font-light select-none">|</span>
              <Link
                href="/blog"
                className="text-sm font-bold tracking-widest uppercase text-primary hover:text-primary/80 transition-colors"
              >
                Blog
              </Link>
            </>
          )}
        </div>

        <nav className="hidden items-center gap-6">
          <Link
            href="/"
            className={`text-sm font-semibold transition-colors ${
              isActive("/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Home
          </Link>
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
            href="/markets"
            className={`text-sm font-semibold transition-colors ${
              isActive("/markets")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Markets
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
          <Link
            href="/blog"
            className={`text-sm font-semibold transition-colors ${
              isActive("/blog") || pathname.startsWith("/blog/")
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Blog
          </Link>
        </nav>

        <button
          onClick={() => setOpen(true)}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className={`fixed inset-0 z-[60] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className={`fixed top-0 right-0 h-full w-3/4 max-w-sm bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-out ${open ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <span className="font-bold text-foreground">Menu</span>
              <button onClick={() => setOpen(false)} className="p-1 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-1 p-4 bg-background/90 flex-1" style={{ height: '100vh' }}>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-lg font-semibold transition-colors ${
                  isActive("/")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-lg font-semibold transition-colors ${
                  isActive("/about")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                About Us
              </Link>
              <Link
                href="/markets"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-lg font-semibold transition-colors ${
                  isActive("/markets")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Markets
              </Link>
              <Link
                href="/contact"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-lg font-semibold transition-colors ${
                  isActive("/contact")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Contact
              </Link>
              <Link
                href="/blog"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-lg font-semibold transition-colors ${
                  isActive("/blog") || pathname.startsWith("/blog/")
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                Blog
              </Link>
              <div className="hidden pt-4 mt-2 border-t border-border">
                <a
                  href={ctaHref}
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all text-base shadow-amber group"
                >
                  Get Cash Offer <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}