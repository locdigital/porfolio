"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type MetricId = "campaigns" | "clients" | "roas";

const timeline = [
  { period: "H1 ’21", campaigns: 2, clients: 1, roas: 1.2 },
  { period: "H2 ’21", campaigns: 5, clients: 2, roas: 1.8 },
  { period: "H1 ’22", campaigns: 5, clients: 2, roas: 0 },
  { period: "H2 ’22", campaigns: 5, clients: 2, roas: 0 },
  { period: "H1 ’23", campaigns: 5, clients: 2, roas: 0 },
  { period: "H2 ’23", campaigns: 12, clients: 5, roas: 2.2 },
  { period: "H1 ’24", campaigns: 28, clients: 9, roas: 3.1 },
  { period: "H2 ’24", campaigns: 52, clients: 16, roas: 4.2 },
  { period: "H1 ’25", campaigns: 79, clients: 23, roas: 5.3 },
  { period: "H2 ’25", campaigns: 112, clients: 32, roas: 6.6 },
  { period: "H1 ’26", campaigns: 134, clients: 39, roas: 7.5 },
  { period: "H2 ’26", campaigns: 150, clients: 45, roas: 8.4 },
];

const metrics: Array<{
  id: MetricId;
  label: string;
  value: string;
  description: string;
  chartLabel: string;
  chartSuffix: string;
  color: string;
}> = [
  {
    id: "campaigns",
    label: "Campaigns launched",
    value: "150+",
    description: "Full-funnel campaigns shipped across performance, brand, social, and commerce.",
    chartLabel: "Campaigns launched",
    chartSuffix: "+",
    color: "#245D9F",
  },
  {
    id: "clients",
    label: "Brands & clients",
    value: "45+",
    description: "Ambitious brands partnered with across growth, product, and digital transformation.",
    chartLabel: "Brands & clients",
    chartSuffix: "+",
    color: "#286747",
  },
  {
    id: "roas",
    label: "Peak blended ROAS",
    value: "8.4×",
    description: "Best blended return achieved while scaling paid media across multiple channels.",
    chartLabel: "Peak blended ROAS",
    chartSuffix: "×",
    color: "#85550F",
  },
];

const achievements = [
  { value: "25B+ VND", label: "Attributed revenue generated" },
  { value: "12B+ VND", label: "Paid media budget scaled" },
  { value: "8.4×", label: "Peak blended ROAS" },
  { value: "120K+", label: "Qualified leads generated" },
];

export default function FeaturedSectionStats() {
  const [metricId, setMetricId] = useState<MetricId>("campaigns");
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const activeMetric = metrics.find((metric) => metric.id === metricId) ?? metrics[0];
  const gradientId = `portfolio-metric-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    // Measure unscaled CSS layout dimensions so the macOS window zoom transform never skews the SVG.
    const measure = () => {
      const width = Math.round(container.clientWidth);
      const height = Math.round(container.clientHeight);
      if (width > 0 && height > 0) {
        setChartSize((prev) =>
          prev.width === width && prev.height === height ? prev : { width, height },
        );
      }
    };

    measure();
    const rafId = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);

    let observer: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const width = Math.round(entry.contentRect.width || container.clientWidth);
        const height = Math.round(entry.contentRect.height || container.clientHeight);
        if (width > 0 && height > 0) {
          setChartSize((prev) =>
            prev.width === width && prev.height === height ? prev : { width, height },
          );
        }
      });
      observer.observe(container);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measure);
      observer?.disconnect();
    };
  }, []);

  return (
    <div aria-labelledby="portfolio-metrics-heading">
      <div className="overflow-hidden rounded-[var(--radius-card-lg)] border border-solid border-[var(--dash-border)] bg-[var(--dash-surface)]">
        <div className="flex flex-col gap-4 border-0 border-b border-solid border-[var(--dash-border)] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
          <div className="max-w-2xl">
            <p className="mb-2 text-[var(--text-caption)] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--dash-muted)]">
              Portfolio metrics
            </p>
            <h2
              id="portfolio-metrics-heading"
              className="m-0 text-[var(--text-h2)] font-semibold leading-[var(--leading-heading)] tracking-[var(--tracking-heading)] text-[var(--dash-text)]"
            >
              Agency-scale execution. Growth you can measure.
            </h2>
            <p className="mt-2 mb-0 max-w-2xl text-[var(--text-body-sm)] leading-[var(--leading-body)] text-[var(--dash-muted)]">
              From first campaign to full-funnel scale: a snapshot of the work, partnerships, and commercial outcomes delivered over time.
            </p>
          </div>

          <span className="w-fit shrink-0 rounded-[var(--radius-control)] border border-solid border-[var(--dash-border)] bg-[var(--dash-surface-subtle)] px-2.5 py-1.5 text-[var(--text-caption)] font-medium text-[var(--dash-muted)]">
            2021 — 2026
          </span>
        </div>

        <div
          className="grid grid-cols-1 border-0 border-b border-solid border-[var(--dash-border)] sm:grid-cols-3"
          role="tablist"
          aria-label="Portfolio metric"
        >
          {metrics.map((metric) => {
            const selected = metric.id === activeMetric.id;
            return (
              <button
                key={metric.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setMetricId(metric.id)}
                className={`group relative min-w-0 border-0 border-b border-solid border-[var(--dash-border)] px-5 py-5 text-left transition-colors last:border-b-0 hover:bg-[var(--dash-surface-subtle)] sm:border-r sm:border-b-0 sm:last:border-r-0 ${
                  selected ? "bg-[var(--dash-surface-subtle)]" : "bg-white"
                }`}
              >
                <span
                  className="absolute inset-x-0 top-0 h-0.5 origin-left transition-transform"
                  style={{
                    backgroundColor: metric.color,
                    transform: selected ? "scaleX(1)" : "scaleX(0)",
                  }}
                  aria-hidden="true"
                />
                <span className="flex items-center gap-2 text-[var(--text-caption)] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--dash-muted)]">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: metric.color }}
                    aria-hidden="true"
                  />
                  {metric.label}
                </span>
                <span className="mt-3 block text-3xl font-semibold leading-none tracking-[-0.035em] text-[var(--dash-text)] sm:text-4xl">
                  {metric.value}
                </span>
                <span
                  className="mt-2 block text-[var(--text-caption)] leading-[var(--leading-compact)]"
                  style={{ color: "var(--dash-muted, #737373)" }}
                >
                  {metric.description}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex items-end justify-between gap-4">
            <div aria-live="polite">
              <p className="m-0 text-[var(--text-body-sm)] font-semibold text-[var(--dash-text)]">
                {activeMetric.chartLabel}
              </p>
              <p className="mt-1 mb-0 text-[var(--text-caption)] text-[var(--dash-muted)]">
                Career journey · six-month intervals
              </p>
            </div>
            <span
              className="shrink-0 text-xl font-semibold tabular-nums sm:text-2xl"
              style={{ color: activeMetric.color }}
            >
              {activeMetric.value}
            </span>
          </div>

          <div
            ref={chartContainerRef}
            className="mt-3 h-60 w-full sm:h-72"
            role="img"
            aria-label={`${activeMetric.chartLabel} cumulative trend from 2021 to 2026, ending at ${activeMetric.value}`}
            onMouseDown={(event) => event.preventDefault()}
          >
            {chartSize.width > 0 && chartSize.height > 0 && (
              <AreaChart
                width={chartSize.width}
                height={chartSize.height}
                data={timeline}
                margin={{ top: 26, right: 12, left: 4, bottom: 4 }}
                accessibilityLayer
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="4%" stopColor={activeMetric.color} stopOpacity={0.24} />
                    <stop offset="96%" stopColor={activeMetric.color} stopOpacity={0.015} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#00000014" strokeDasharray="3 5" />
                <ReferenceArea
                  x1="H1 ’22"
                  x2="H1 ’23"
                  fill="#686863"
                  fillOpacity={0.055}
                  strokeOpacity={0}
                  label={{
                    value: "Career reset",
                    position: "insideTop",
                    fill: "#686863",
                    fontSize: 10,
                  }}
                />
                <ReferenceLine
                  x="H2 ’23"
                  stroke="#68686366"
                  strokeDasharray="3 4"
                  label={{
                    value: "Restart",
                    position: "insideTopRight",
                    fill: "#686863",
                    fontSize: 10,
                  }}
                />
                <XAxis
                  dataKey="period"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#686863", fontSize: 11 }}
                  minTickGap={18}
                  dy={8}
                />
                <YAxis
                  allowDecimals={activeMetric.id === "roas"}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#686863", fontSize: 11 }}
                  width={42}
                />
                <Tooltip
                  cursor={{ stroke: "#00000024", strokeWidth: 1 }}
                  contentStyle={{
                    border: "1px solid #00000014",
                    borderRadius: "8px",
                    background: "#ffffff",
                    color: "#292927",
                    fontSize: "12px",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.08)",
                  }}
                  formatter={(value) => [
                    `${Number(value)}${activeMetric.chartSuffix}`,
                    activeMetric.chartLabel,
                  ]}
                />
                <Area
                  key={activeMetric.id}
                  type="monotone"
                  dataKey={activeMetric.id}
                  stroke={activeMetric.color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  fillOpacity={1}
                  activeDot={{ r: 4, fill: "#ffffff", strokeWidth: 2 }}
                  isAnimationActive
                  animationDuration={420}
                />
              </AreaChart>
            )}
          </div>
        </div>

        <div className="border-0 border-t border-solid border-[var(--dash-border)] bg-[var(--dash-surface-subtle)] px-5 py-5 sm:px-6 sm:py-6">
          <p className="mb-4 text-[var(--text-caption)] font-semibold uppercase tracking-[var(--tracking-caps)] text-[var(--dash-muted)]">
            Achievement highlights
          </p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-6 lg:grid-cols-4 lg:gap-x-8">
            {achievements.map((achievement) => (
              <div key={achievement.label} className="min-w-0">
                <p className="m-0 text-2xl font-semibold leading-tight tracking-[-0.025em] text-[var(--dash-text)] sm:text-3xl">
                  {achievement.value}
                </p>
                <p className="mt-1.5 mb-0 text-[var(--text-caption)] leading-[var(--leading-compact)] text-[var(--dash-muted)]">
                  {achievement.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
