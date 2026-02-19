import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText } from "lucide-react";
import { fetchTransparencyData, formatCurrency, formatDate } from "@/lib/api";
import { Button } from "@/components/ui/button";

const barColors = ["bg-primary", "bg-chart-blue", "bg-chart-amber", "bg-chart-violet", "bg-muted-foreground"];

export default function TransparencyPage() {
  const { data, isLoading } = useQuery({ queryKey: ["transparency"], queryFn: fetchTransparencyData });

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Financial Transparency</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We believe in complete transparency. All our financial reports and audit documents are publicly available.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl space-y-6">
          <h2 className="text-2xl font-bold text-center">Financial Snapshot</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="admin-card">
              <p className="text-xs text-muted-foreground">Total Raised</p>
              <p className="text-xl font-bold font-mono-stat mt-1">{formatCurrency(data?.totalRaised ?? 0)}</p>
            </div>
            <div className="admin-card">
              <p className="text-xs text-muted-foreground">Total Disbursed</p>
              <p className="text-xl font-bold font-mono-stat mt-1">{formatCurrency(data?.totalDisbursed ?? 0)}</p>
            </div>
            <div className="admin-card">
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-xl font-bold font-mono-stat mt-1">{formatCurrency(data?.availableBalance ?? 0)}</p>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-center pt-2">Donation Mix</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-card animate-pulse"><div className="h-10 bg-muted rounded" /></div>
            ))}

            {!isLoading && (data?.breakdown || []).map((item, i) => (
              <div key={item.key} className="admin-card">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="font-mono-stat text-sm font-bold">{item.pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full ${barColors[i % barColors.length]}`} style={{ width: `${item.pct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.amount)}</p>
              </div>
            ))}

            {!isLoading && (data?.breakdown?.length || 0) === 0 && (
              <p className="text-sm text-muted-foreground col-span-full text-center">No donation records available yet.</p>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Download Reports</h2>
          <div className="space-y-3">
            {isLoading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-card animate-pulse"><div className="h-12 bg-muted rounded" /></div>
            ))}

            {!isLoading && (data?.reports || []).map((report, i) => (
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
                    <p className="text-xs text-muted-foreground">{report.type} · {formatDate(report.uploadedAt)}</p>
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
              <p className="text-sm text-muted-foreground text-center py-6">No reports uploaded yet.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
