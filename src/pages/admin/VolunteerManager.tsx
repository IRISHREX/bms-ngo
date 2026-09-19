import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateVolunteerPdf } from "@/lib/pdfGenerator";
import { fetchVolunteers, formatDate, updateVolunteerStatus, type Volunteer } from "@/lib/api";
import { authHeaders } from "@/lib/auth";
import { Search, Download, Eye, FileText, ExternalLink, Image as ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const statusColors: Record<Volunteer["status"], "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  contacted: "secondary",
  approved: "outline",
  rejected: "destructive",
};

export default function VolunteerManager() {
  const queryClient = useQueryClient();
  const { data: volunteers = [], isLoading } = useQuery({ queryKey: ["volunteers"], queryFn: fetchVolunteers });
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Volunteer["status"] }) => updateVolunteerStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["volunteers"] });
      toast({ title: "Status updated" });
      setUpdatingId(null);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      setUpdatingId(null);
    },
  });

  const filtered = volunteers.filter(
    (v) =>
      v.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (v.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (v.mobileNo ?? "").includes(search)
  );

  const exportCsv = async () => {
    try {
      const base = import.meta.env.VITE_API_URL || "/api";
      const res = await fetch(`${base}/volunteers/export`, { headers: authHeaders() });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "volunteers.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Export failed";
      toast({ title: "Export failed", description: message, variant: "destructive" });
    }
  };

  const handleStatusChange = (id: string, status: Volunteer["status"]) => {
    setUpdatingId(id);
    updateStatusMutation.mutate({ id, status });
  };

  const downloadVolunteerPdf = async (v: Volunteer) => {
    try {
      await generateVolunteerPdf(v);
    } catch (err) {
      console.error("Failed to generate PDF", err);
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    }
  };

  const countDocs = (v: Volunteer) => {
    let count = 0;
    if (v.photoPath) count++;
    if (v.aadhaarPath) count++;
    if (v.addressProofPath) count++;
    if (v.otherDocPath) count++;
    return count;
  };

  const resolveDocUrl = (url?: string, downloadEndpoint?: string) => {
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      return url;
    }
    const base = import.meta.env.VITE_API_URL || "/api";
    if (downloadEndpoint) {
      if (downloadEndpoint.startsWith("/api")) {
        const apiOrigin = base.replace(/\/api\/?$/, "");
        return `${apiOrigin}${downloadEndpoint}`;
      }
      return `${base}${downloadEndpoint}`;
    }
    if (url) {
      const clean = url.replace(/^\/?uploads\/?/, "");
      const baseUploads = base.replace(/\/api\/?$/, "") + "/uploads";
      return `${baseUploads}/${clean}`;
    }
    return null;
  };

  const triggerDownload = async (fileUrl: string, fileName: string) => {
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("Direct fetch failed");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(fileUrl, "_blank");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Volunteers & Contacts</h1>
          <p className="page-description">{volunteers.length} submissions</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={exportCsv}>
          <Download className="w-4 h-4" /> Export CSV
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="admin-card p-0 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="table-header text-left px-4 py-3">Applicant</th>
              <th className="table-header text-left px-4 py-3">Mobile</th>
              <th className="table-header text-left px-4 py-3">Documents</th>
              <th className="table-header text-left px-4 py-3">Type</th>
              <th className="table-header text-left px-4 py-3">Status</th>
              <th className="table-header text-left px-4 py-3">Date</th>
              <th className="table-header text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="border-b border-border"><td colSpan={7} className="px-4 py-3"><div className="h-5 bg-muted rounded animate-pulse" /></td></tr>
                ))
              : filtered.map((v) => {
                  const docCount = countDocs(v);
                  const photoUrl = resolveDocUrl(v.photoPath, v.photoDownloadUrl);
                  return (
                    <tr key={v.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            <img
                              src={photoUrl}
                              alt={v.fullName}
                              className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                              onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                              {v.fullName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium leading-none">{v.fullName}</div>
                            <div className="text-xs text-muted-foreground mt-1">{v.email || v.applicationNo || "No email"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{v.mobileNo ?? "—"}</td>
                      <td className="px-4 py-3">
                        <Button
                          variant={docCount > 0 ? "secondary" : "ghost"}
                          size="sm"
                          className="h-8 gap-1.5 text-xs font-normal"
                          onClick={() => setSelectedVolunteer(v)}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          {docCount > 0 ? `${docCount} doc(s)` : "No docs"}
                        </Button>
                      </td>
                      <td className="px-4 py-3"><Badge variant="outline" className="text-xs capitalize">{v.membershipType ?? "—"}</Badge></td>
                      <td className="px-4 py-3">
                        <Select value={v.status} onValueChange={(val) => handleStatusChange(v.id, val as Volunteer["status"])}>
                          <SelectTrigger className="h-8 w-[125px]" disabled={updatingId === v.id}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">new</SelectItem>
                            <SelectItem value="contacted">contacted</SelectItem>
                            <SelectItem value="approved">approved</SelectItem>
                            <SelectItem value="rejected">rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(v.createdAt)}</td>
                      <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => downloadVolunteerPdf(v)} title="Download Registration PDF">
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedVolunteer(v)} title="View Documents">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {/* Documents Modal */}
      <Dialog open={!!selectedVolunteer} onOpenChange={(open) => { if (!open) setSelectedVolunteer(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Documents — {selectedVolunteer?.fullName}
            </DialogTitle>
            <DialogDescription>
              Registration: {selectedVolunteer?.applicationNo || selectedVolunteer?.id} | Mobile: {selectedVolunteer?.mobileNo}
            </DialogDescription>
          </DialogHeader>

          {selectedVolunteer && (
            <div className="space-y-5 py-3">
              {/* Photo Preview Card */}
              <div className="p-4 rounded-lg border bg-card flex flex-col sm:flex-row items-center gap-4">
                {resolveDocUrl(selectedVolunteer.photoPath, selectedVolunteer.photoDownloadUrl) ? (
                  <img
                    src={resolveDocUrl(selectedVolunteer.photoPath, selectedVolunteer.photoDownloadUrl)!}
                    alt="Volunteer Photo"
                    className="w-24 h-24 rounded-md object-cover border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                  </div>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h4 className="font-semibold text-sm">Passport / Profile Photo</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedVolunteer.photoPath ? "Photo uploaded" : "No photo provided"}
                  </p>
                  {resolveDocUrl(selectedVolunteer.photoPath, selectedVolunteer.photoDownloadUrl) && (
                    <div className="flex gap-2 mt-3 justify-center sm:justify-start">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => window.open(resolveDocUrl(selectedVolunteer.photoPath, selectedVolunteer.photoDownloadUrl)!, "_blank")}
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View Photo
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => triggerDownload(
                          resolveDocUrl(selectedVolunteer.photoPath, selectedVolunteer.photoDownloadUrl)!,
                          `${selectedVolunteer.fullName.replace(/\s+/g, "_")}_photo.jpg`
                        )}
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Document List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Attached Verification Documents</h4>
                
                {/* Aadhaar Card */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {selectedVolunteer.aadhaarPath ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground opacity-50" />
                    )}
                    <div>
                      <div className="text-sm font-medium">Aadhaar Card Copy</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedVolunteer.aadhaarNo ? `Aadhaar: ${selectedVolunteer.aadhaarNo}` : "Identity document"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {resolveDocUrl(selectedVolunteer.aadhaarPath, selectedVolunteer.aadhaarDownloadUrl) ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => window.open(resolveDocUrl(selectedVolunteer.aadhaarPath, selectedVolunteer.aadhaarDownloadUrl)!, "_blank")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => triggerDownload(
                            resolveDocUrl(selectedVolunteer.aadhaarPath, selectedVolunteer.aadhaarDownloadUrl)!,
                            `${selectedVolunteer.fullName.replace(/\s+/g, "_")}_aadhaar.pdf`
                          )}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not uploaded</span>
                    )}
                  </div>
                </div>

                {/* Address Proof */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {selectedVolunteer.addressProofPath ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground opacity-50" />
                    )}
                    <div>
                      <div className="text-sm font-medium">Address Proof Copy</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedVolunteer.address ? `${selectedVolunteer.address}, ${selectedVolunteer.district || ""}` : "Residence verification"}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {resolveDocUrl(selectedVolunteer.addressProofPath, selectedVolunteer.addressProofDownloadUrl) ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => window.open(resolveDocUrl(selectedVolunteer.addressProofPath, selectedVolunteer.addressProofDownloadUrl)!, "_blank")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => triggerDownload(
                            resolveDocUrl(selectedVolunteer.addressProofPath, selectedVolunteer.addressProofDownloadUrl)!,
                            `${selectedVolunteer.fullName.replace(/\s+/g, "_")}_address_proof.pdf`
                          )}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not uploaded</span>
                    )}
                  </div>
                </div>

                {/* Other Document */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {selectedVolunteer.otherDocPath ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground opacity-50" />
                    )}
                    <div>
                      <div className="text-sm font-medium">Additional Document</div>
                      <div className="text-xs text-muted-foreground">Certificates, resume or other attachments</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {resolveDocUrl(selectedVolunteer.otherDocPath, selectedVolunteer.otherDocDownloadUrl) ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1"
                          onClick={() => window.open(resolveDocUrl(selectedVolunteer.otherDocPath, selectedVolunteer.otherDocDownloadUrl)!, "_blank")}
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => triggerDownload(
                            resolveDocUrl(selectedVolunteer.otherDocPath, selectedVolunteer.otherDocDownloadUrl)!,
                            `${selectedVolunteer.fullName.replace(/\s+/g, "_")}_other_doc.pdf`
                          )}
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </Button>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">Not uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            {selectedVolunteer && (
              <Button
                variant="outline"
                className="gap-2 w-full sm:w-auto"
                onClick={() => downloadVolunteerPdf(selectedVolunteer)}
              >
                <Download className="w-4 h-4" /> Download Complete Application (PDF)
              </Button>
            )}
            <Button variant="secondary" onClick={() => setSelectedVolunteer(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
