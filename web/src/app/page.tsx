"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen text-[#e8ecf1]">
      {/* Clip only the background layers, not the text */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#0e1116]/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e1116]/88 via-[#0e1116]/45 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#0e1116] to-transparent" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <span
            className="text-lg font-semibold tracking-normal"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Volt<span className="text-[#f0772a]">art</span>
          </span>
          <Link
            href="/app/analyst"
            className="rounded-lg bg-[#f0772a] px-4 py-2 text-sm font-semibold text-[#0e1116] transition hover:bg-[#ff9a4d]"
          >
            Open dashboard
          </Link>
        </header>

        <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 pb-20 pt-8">
          <p className="text-sm uppercase tracking-[0.16em] text-[#f0772a]">
            Industrial energy analytics
          </p>
          <h1
            className="mt-4 max-w-2xl overflow-visible pb-2 text-4xl leading-[1.25] tracking-normal md:text-5xl md:leading-[1.22] lg:text-6xl lg:leading-[1.2]"
            style={{ fontFamily: "var(--font-body)", fontWeight: 700 }}
          >
            Energy cost clarity for manufacturing sites
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[#c5ccd6] md:text-lg">
            Track usage, demand charges, intensity, anomalies, and forecasts — from meters to
            budget variance in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app/analyst"
              className="rounded-lg bg-[#f0772a] px-5 py-3 text-sm font-semibold leading-none text-[#0e1116] shadow-[0_12px_36px_rgba(240,119,42,0.35)] transition hover:bg-[#ff9a4d]"
            >
              View live demo
            </Link>
            <a
              href="#capabilities"
              className="rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-sm leading-none text-[#e8ecf1] backdrop-blur-sm transition hover:bg-white/10"
            >
              Capabilities
            </a>
          </div>
        </section>

        <section id="capabilities" className="border-t border-white/10 bg-[#0e1116]/80 backdrop-blur-md">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3">
            {[
              {
                title: "Cost drivers",
                body: "Split energy, demand, and gas so overspend is explainable — not just a total.",
              },
              {
                title: "Intensity & anomalies",
                body: "Normalize kWh to production units and flag abnormal days automatically.",
              },
              {
                title: "Forecast",
                body: "Project the next two weeks of load with a transparent backtest MAPE.",
              },
            ].map((item) => (
              <div key={item.title}>
                <h2
                  className="text-lg font-semibold leading-snug"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#8b939e]">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
