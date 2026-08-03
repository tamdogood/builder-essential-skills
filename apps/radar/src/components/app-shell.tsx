"use client";

import { Activity, BookOpenText, FlaskConical, Lightbulb, Radar } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navigation = [
  { href: "/", label: "Papers", icon: BookOpenText, match: (path: string) => path === "/" || path.startsWith("/papers") },
  { href: "/opportunities", label: "Opportunities", icon: Lightbulb, match: (path: string) => path.startsWith("/opportunities") },
  { href: "/reports", label: "Reports", icon: FlaskConical, match: (path: string) => path.startsWith("/reports") },
  { href: "/runs", label: "Runs", icon: Activity, match: (path: string) => path.startsWith("/runs") },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") setKeyboardNavigation(true);
    };
    const onPointerDown = () => setKeyboardNavigation(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);
  return (
    <div className={keyboardNavigation ? "app-shell keyboard-navigation" : "app-shell"}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header">
        <Link className="wordmark" href="/" aria-label="Opportunity Radar home">
          <span className="logo-mark" aria-hidden="true"><Radar size={20} strokeWidth={1.7} /></span>
          <span>Opportunity Radar</span>
        </Link>
        <p className="header-descriptor">
          Frontier research index
          <span>Agent operated / evidence first</span>
        </p>
        <nav className="site-nav" aria-label="Primary navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <Link aria-current={active ? "page" : undefined} href={item.href} key={item.href}>
                <Icon aria-hidden="true" size={14} strokeWidth={1.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <p>Opportunity Radar / {new Date().getFullYear()}</p>
        <nav aria-label="System links">
          <a href="/api/v1/health">Status</a>
          <a href="/api/v1/schema">Agent schema</a>
          <a href="/openapi.json">Agent API</a>
        </nav>
      </footer>
    </div>
  );
}
