import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchDonations, formatCurrency, formatDate, generateReceipt } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { Download, Receipt, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export default function DonationManager() {
  const queryClient = useQueryClient();
  const { data: donations = [], isLoading } = useQuery({ queryKey: ["donations"], queryFn: fetchDonations });
  const [search, setSearch] = useState("");
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  const receiptMutation = useMutation({
    mutationFn: (id: string) => generateReceipt(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["donations"] });
      toast({ title: "Receipt generated" });
      setReceiptLoadingId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Receipt failed", description: error.message, variant: "destructive" });
      setReceiptLoadingId(null);
    },
  });

  const filtered = donations.filter(
    (d) => d.donorName.toLowerCase().includes(search.toLowerCase()) || d.paymentId.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);

  const downloadReport = async () => {
    try {
      const base = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${base}/donations/report`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Download failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "donations-report.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Download failed";
      toast({ title: "Report download failed", description: message, variant: "destructive" });
    }
  };

  const onGenerateReceipt = (id: string) => {
    setReceiptLoadingId(id);
    receiptMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Donations</h1>
          <p className="page-description">{donations.length} donations &middot; Total: {formatCurrency(totalAmount)}</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={downloadReport}>
          <Download className="w-4 h-4" /> Download Report
        </Button>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "One-time", count: donations.filter(d => d.type === "one-time").length, amount: donations.filter(d => d.type === "one-time").reduce((s, d) => s + d.amount, 0) },
          { label: "Monthly", count: donations.filter(d => d.type === "monthly").length, amount: donations.filter(d => d.type === "monthly").reduce((s, d) => s + d.amount, 0) },
          { label: "Campaign", count: donations.filter(d => d.type === "campaign").length, amount: donations.filter(d => d.type === "campaign").reduce((s, d) => s + d.amount, 0) },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-bold font-mono-stat mt-1">{formatCurrency(stat.amount)}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.count} donations</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by donor or payment ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header text-left px-4 py-3">Donor</th>
              <th className="table-header text-left px-4 py-3">Amount</th>
              <th className="table-header text-left px-4 py-3">Type</th>
              <th className="table-header text-left px-4 py-3">Payment ID</th>
              <th className="table-header text-left px-4 py-3">Date</th>
              <th className="table-header text-left px-4 py-3">Receipt</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={6} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td></tr>
                ))
              : filtered.map((d) => (
                  <tr key={d.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">{d.donorName}</td>
                    <td className="px-4 py-3 text-sm font-mono-stat font-semibold">{formatCurrency(d.amount)}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className="text-xs capitalize">{d.type}</Badge></td>
                    <td className="px-4 py-3 text-sm text-muted-foreground font-mono-stat">{d.paymentId}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(d.date)}</td>
                    <td className="px-4 py-3">
                      {d.receiptGenerated ? (
                        <Badge variant="secondary" className="text-xs gap-1"><Receipt className="w-3 h-3" /> Sent</Badge>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => onGenerateReceipt(d.id)}
                          disabled={receiptLoadingId === d.id}
                        >
                          {receiptLoadingId === d.id ? "Generating..." : "Generate"}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
