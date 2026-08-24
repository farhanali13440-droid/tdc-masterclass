import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { CtaButton, TdcLogo } from "./brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to="/" aria-label="The Diabetes Centre Pakistan home" className="min-w-0">
          <TdcLogo />
        </Link>
        <div className="hidden sm:block">
          <CtaButton size="md" event="header">
            Join for PKR 499
          </CtaButton>
        </div>
      </div>
    </header>
  );
}

export function StickyMobileCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      id="sticky-mobile-cta"
      className={`fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 sm:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <CtaButton event="sticky-mobile" className="w-full">
        Join for PKR 499
      </CtaButton>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-tint px-5 py-12 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <TdcLogo />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-navy">
            <Link to="/">Masterclass</Link>
            <Link to="/checkout">Register</Link>
          </nav>
        </div>
        <p className="max-w-4xl text-xs leading-relaxed text-muted-foreground">
          This masterclass is for educational and awareness purposes and does not replace
          professional medical diagnosis, treatment or medical advice. Do not change or stop
          prescribed medication without consulting your healthcare professional. Individual
          results may vary.
        </p>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} The Diabetes Centre Pakistan. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
