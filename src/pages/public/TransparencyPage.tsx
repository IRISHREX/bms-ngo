import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";
import { fetchTransparencyData, formatCurrency, formatDate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useI18n } from "@/lib/i18n";

const PIE_COLORS = ["#2f6f8f", "#2d8c7f", "#c98f3d", "#9b5db4", "#5a6472"];

const CHART_DIM = {
  cx: "50%",
  cy: "50%",
  innerRadius: 78,
  outerRadius: 122,
  outerRadiusActive: 130,
} as const;

const CARD_DIM = {
  minHeight: 360,
  loadingHeight: 320,
} as const;

export default function TransparencyPage() {
  const { t } = useI18n();
  const { data, isLoading } = useQuery({ queryKey: ["transparency"], queryFn: fetchTransparencyData });

  const pieData = useMemo(() => (data?.breakdown || []).filter((item) => item.amount > 0), [data?.breakdown]);
  const [activeIndex, setActiveIndex] = useState(0);

  const totalMix = pieData.reduce((sum, item) => sum + item.amount, 0);
  const activeItem = pieData[activeIndex] || pieData[0];

  const chartConfig = useMemo(
    () =>
      pieData.reduce<Record<string, { label: string; color: string }>>((acc, item, index) => {
        acc[item.key] = { label: item.label, color: PIE_COLORS[index % PIE_COLORS.length] };
        return acc;
      }, {}),
    [pieData],
  );

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("transparency.title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("transparency.subtitle")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl space-y-6">
          <h2 className="text-2xl font-bold text-center">{t("transparency.snapshot")}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="admin-card">
              <p className="text-xs text-muted-foreground">{t("transparency.totalRaised")}</p>
              <p className="text-xl font-bold font-mono-stat mt-1">{formatCurrency(data?.totalRaised ?? 0)}</p>
            </div>
            <div className="admin-card">
              <p className="text-xs text-muted-foreground">{t("transparency.totalDisbursed")}</p>
              <p className="text-xl font-bold font-mono-stat mt-1">{formatCurrency(data?.totalDisbursed ?? 0)}</p>
            </div>
            <div className="admin-card">
              <p className="text-xs text-muted-foreground">{t("transparency.availableBalance")}</p>
              <p className="text-xl font-bold font-mono-stat mt-1">{formatCurrency(data?.availableBalance ?? 0)}</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-center pt-2">{t("transparency.donationMix")}</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="admin-card" style={{ minHeight: CARD_DIM.minHeight }}>
              {isLoading && <div className="bg-muted rounded animate-pulse" style={{ height: CARD_DIM.loadingHeight }} />}

              {!isLoading && pieData.length > 0 && (
                <div className="h-[360px] w-full">
                  <ChartContainer config={chartConfig} className="h-full w-full">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value, name) => [formatCurrency(Number(value)), String(name)]} />} />

                      <Pie
                        data={pieData}
                        dataKey="amount"
                        nameKey="label"
                        cx={CHART_DIM.cx}
                        cy={CHART_DIM.cy}
                        innerRadius={CHART_DIM.innerRadius}
                        outerRadius={CHART_DIM.outerRadius}
                        activeIndex={activeIndex}
                        activeOuterRadius={CHART_DIM.outerRadiusActive}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onClick={(_, index) => setActiveIndex(index)}
                        isAnimationActive
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`slice-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(255,255,255,0.38)" strokeWidth={2} />
                        ))}
                      </Pie>

                      <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                    </PieChart>
                  </ChartContainer>

                  {activeItem && (
                    <div className="-mt-14 text-center pointer-events-none">
                      <p className="text-xs text-muted-foreground">{activeItem.label}</p>
                      <p className="text-2xl font-bold font-mono-stat">{activeItem.pct}%</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(activeItem.amount)} of {formatCurrency(totalMix)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {!isLoading && pieData.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-24">{t("transparency.noDonations")}</p>
              )}
            </div>

            <div className="space-y-3">
              {isLoading && Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="admin-card animate-pulse"><div className="h-10 bg-muted rounded" /></div>
              ))}

              {!isLoading && pieData.map((item, index) => {
                const isActive = index === activeIndex;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    className={`admin-card w-full text-left transition-all ${isActive ? "ring-2 ring-primary/40 translate-x-1" : ""}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <span className="font-mono-stat text-sm font-bold">{item.pct}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatCurrency(item.amount)}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-8 text-center">{t("transparency.downloadReports")}</h2>
          <div className="space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="admin-card animate-pulse"><div className="h-12 bg-muted rounded" /></div>
            ))}

            {!isLoading && (data?.reports || []).map((report) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="admin-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-medium">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{t("transparency.publishedTypeDate", { type: report.type, date: formatDate(report.uploadedAt) })}</p>
                  </div>
                </div>
                <a href={report.url} target="_blank" rel="noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <Download className="w-3 h-3" /> PDF
                  </Button>
                </a>
              </motion.div>
            ))}

            {!isLoading && (data?.reports?.length || 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">{t("transparency.noReports")}</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
