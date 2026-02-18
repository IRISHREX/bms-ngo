import { useQuery } from "@tanstack/react-query";
import { fetchNotices, formatDate } from "@/lib/api";
import { Pin, Plus, Edit, Trash2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function NoticeManager() {
  const { data: notices = [], isLoading } = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Notices & Announcements</h1>
          <p className="page-description">{notices.length} notices published</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> New Notice
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="admin-card animate-pulse"><div className="h-16 bg-muted rounded" /></div>
            ))
          : notices.map((notice) => (
              <div key={notice.id} className="admin-card flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {notice.pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
                    <h3 className="text-sm font-semibold">{notice.title}</h3>
                    <Badge variant={notice.status === "active" ? "default" : "secondary"} className="text-xs">
                      {notice.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notice.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>Published: {formatDate(notice.publishDate)}</span>
                    {notice.expiryDate && <span>Expires: {formatDate(notice.expiryDate)}</span>}
                    {notice.attachmentUrl && (
                      <span className="flex items-center gap-1"><Paperclip className="w-3 h-3" /> Attachment</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}
