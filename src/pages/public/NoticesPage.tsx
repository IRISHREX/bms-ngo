import { useQuery } from "@tanstack/react-query";
import { fetchNotices, formatDate } from "@/lib/api";
import { Pin, Paperclip } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";

export default function NoticesPage() {
  const { t } = useI18n();
  const { data: notices = [] } = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });
  const active = notices.filter((notice) => notice.status === "active");

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("notices.title")}</h1>
          <p className="text-muted-foreground">{t("notices.subtitle")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-3xl space-y-4">
          {active.map((notice, index) => (
            <motion.div
              key={notice.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="admin-card space-y-2"
            >
              <div className="flex items-center gap-2">
                {notice.pinned && <Pin className="w-4 h-4 text-primary" />}
                <h2 className="font-semibold">{notice.title}</h2>
                {notice.pinned && <Badge variant="default" className="text-xs">{t("notices.pinned")}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">{notice.description}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{t("notices.published", { date: formatDate(notice.publishDate) })}</span>
                {notice.expiryDate && <span>{t("notices.expires", { date: formatDate(notice.expiryDate) })}</span>}
                {notice.attachmentUrl && (
                  <span className="flex items-center gap-1 text-primary cursor-pointer"><Paperclip className="w-3 h-3" /> {t("notices.download")}</span>
                )}
              </div>
            </motion.div>
          ))}
          {active.length === 0 && <p className="text-center text-muted-foreground py-12">{t("notices.empty")}</p>}
        </div>
      </section>
    </div>
  );
}
