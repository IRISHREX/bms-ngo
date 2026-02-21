import { motion } from "framer-motion";
import { Heart, Target, Award, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();

  const timeline = [
    { year: "2021", title: t("about.timeline.2021.title"), desc: t("about.timeline.2021.desc") },
    { year: "2022", title: t("about.timeline.2022.title"), desc: t("about.timeline.2022.desc") },
    { year: "2023", title: t("about.timeline.2023.title"), desc: t("about.timeline.2023.desc") },
    { year: "2024", title: t("about.timeline.2024.title"), desc: t("about.timeline.2024.desc") },
    { year: "2025", title: t("about.timeline.2025.title"), desc: t("about.timeline.2025.desc") },
  ];

  const docs = [
    { title: t("about.doc.ngo.title"), desc: t("about.doc.ngo.desc"), icon: Award },
    { title: t("about.doc.80g.title"), desc: t("about.doc.80g.desc"), icon: FileText },
    { title: t("about.doc.12a.title"), desc: t("about.doc.12a.desc"), icon: FileText },
  ];

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold mb-4">{t("about.title")}</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">{t("about.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="admin-card space-y-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{t("about.mission.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("about.mission.body")}</p>
          </div>
          <div className="admin-card space-y-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">{t("about.vision.title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("about.vision.body")}</p>
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">F</span>
            </div>
            <h2 className="text-2xl font-bold">{t("about.founder.title")}</h2>
            <blockquote className="text-lg text-muted-foreground italic leading-relaxed">{t("about.founder.quote")}</blockquote>
            <p className="font-semibold">{t("about.founder.byline")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-12">{t("about.journey.title")}</h2>
          <div className="space-y-8">
            {timeline.map((item, index) => (
              <motion.div
                key={item.year}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="flex gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{item.year.slice(2)}</div>
                  {index < timeline.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
                </div>
                <div className="pb-8">
                  <h3 className="font-semibold">{item.year} - {item.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-2">{t("about.docs.title")}</h2>
            <p className="text-muted-foreground">{t("about.docs.subtitle")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {docs.map((doc) => (
              <div key={doc.title} className="admin-card text-center space-y-3">
                <doc.icon className="w-8 h-8 text-primary mx-auto" />
                <h3 className="font-semibold text-sm">{doc.title}</h3>
                <p className="text-xs text-muted-foreground">{doc.desc}</p>
                <Button variant="outline" size="sm" className="gap-1">
                  <Download className="w-3 h-3" /> {t("about.docs.download")}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
