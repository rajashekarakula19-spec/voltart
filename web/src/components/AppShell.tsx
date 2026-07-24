"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HelpButton, type MetricHelp } from "@/components/MetricHelp";

export function money(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function num(n: number, d = 1) {
  return n.toLocaleString("en-US", { maximumFractionDigits: d });
}

export const tipStyle = {
  background: "#171b22",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  fontSize: 12,
};

export function Kpi({
  label,
  value,
  hint,
  tone = "text-[#e8ecf1]",
  help,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
  help?: MetricHelp;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-[#171b22] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b939e]">
        {label}
        {help ? <HelpButton help={help} /> : null}
      </div>
      <div
        className={`mt-2 text-2xl font-semibold tabular-nums tracking-tight ${tone}`}
        style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-[#8b939e]">{hint}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  subtitle,
  children,
  className = "",
  help,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  help?: MetricHelp;
}) {
  return (
    <section className={`rounded-2xl border border-white/8 bg-[#171b22] p-5 ${className}`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center text-base font-semibold leading-snug text-[#e8ecf1]">
            {title}
            {help ? <HelpButton help={help} /> : null}
          </h2>
          {subtitle ? <p className="mt-1 text-xs text-[#8b939e]">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function AppShell({
  title,
  children,
  siteId,
  onSiteChange,
  sites,
}: {
  title: string;
  children: React.ReactNode;
  siteId: string;
  onSiteChange: (id: string) => void;
  sites: { site_id: string; site_name: string }[];
}) {
  const pathname = usePathname();
  const links = [
    { href: "/app/analyst", label: "Analyst" },
    { href: "/app/forecast", label: "Forecast" },
  ];

  return (
    <div className="min-h-screen bg-[#0e1116] text-[#e8ecf1]">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0e1116]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/" className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Volt<span className="text-[#f0772a]">art</span>
            </Link>
            <nav className="flex gap-1 rounded-xl border border-white/10 bg-[#171b22] p-1">
              {links.map((l) => {
                const active = pathname?.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={`rounded-lg px-3 py-1.5 text-sm transition ${
                      active ? "bg-[#f0772a] font-semibold text-[#0e1116]" : "text-[#8b939e] hover:text-white"
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
            <span className="hidden text-sm text-[#8b939e] sm:inline">{title}</span>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="site" className="text-sm text-[#8b939e]">
              Site
            </label>
            <select
              id="site"
              value={siteId}
              onChange={(e) => onSiteChange(e.target.value)}
              className="rounded-xl border border-white/10 bg-[#171b22] px-3 py-2 text-sm outline-none focus:border-[#5b8fa8]"
            >
              <option value="all">All sites</option>
              {sites.map((s) => (
                <option key={s.site_id} value={s.site_id}>
                  {s.site_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-5 px-5 py-6 md:px-8">{children}</main>
    </div>
  );
}
