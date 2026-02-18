import { useQuery } from "@tanstack/react-query";
import { fetchNotices, formatDate } from "@/lib/api";
import { Pin, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function NoticesPage() {
  const { data: notices = [] } = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });
  const active = notices.filter((n) => n.status === "active");

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Notices & Announcements</h1>
          <p className="text-muted-foreground">Stay updated with our latest events and opportunities</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-4">
          {active.map((notice, i) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="admin-card space-y-2"
            >
              <div className="flex items-center gap-2">
                {notice.pinned && <Pin className="w-4 h-4 text-primary" />}
                <h2 className="font-semibold">{notice.title}</h2>
                {notice.pinned && <Badge variant="default" className="text-xs">Pinned</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{notice.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Published: {formatDate(notice.publishDate)}</span>
                {notice.expiryDate && <span>Expires: {formatDate(notice.expiryDate)}</span>}
                {notice.attachmentUrl && (
                  <span className="flex items-center gap-1 text-primary cursor-pointer"><Paperclip className="w-3 h-3" /> Download</span>
                )}
              </div>
            </motion.div>
          ))}
          {active.length === 0 && <p className="text-center text-muted-foreground py-12">No active notices.</p>}
        </div>
      </section>
    </div>
  );
}
