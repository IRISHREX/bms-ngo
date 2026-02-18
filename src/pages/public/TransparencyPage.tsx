import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

const reports = [
  { year: "2024-25", title: "Annual Report 2024-25", type: "Annual Report" },
  { year: "2023-24", title: "Annual Report 2023-24", type: "Annual Report" },
  { year: "2024-25", title: "Audit Report 2024-25", type: "Audit Report" },
  { year: "2023-24", title: "Audit Report 2023-24", type: "Audit Report" },
];

export default function TransparencyPage() {
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

      {/* Fund Utilization */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Fund Utilization 2024-25</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Education Programs", pct: 45, color: "bg-primary" },
              { label: "Healthcare & Medical Camps", pct: 25, color: "bg-chart-blue" },
              { label: "Food Distribution", pct: 15, color: "bg-chart-amber" },
              { label: "Administration", pct: 10, color: "bg-muted-foreground" },
              { label: "Women Empowerment", pct: 5, color: "bg-chart-violet" },
            ].map((item) => (
              <div key={item.label} className="admin-card">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <span className="font-mono-stat text-sm font-bold">{item.pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reports Download */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Download Reports</h2>
          <div className="space-y-3">
            {reports.map((report, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="admin-card flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <h3 className="text-sm font-medium">{report.title}</h3>
                    <p className="text-xs text-muted-foreground">{report.type} · {report.year}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-3 h-3" /> PDF
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
