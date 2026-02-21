import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, fetchProjects, formatCurrency } from "@/lib/api";
import { MapPin, ArrowRight, GraduationCap, UtensilsCrossed, Users, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

export default function ImpactPage() {
  const { t, locale } = useI18n();
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchDashboardStats });
  const { data: projects = [] } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("impact.title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("impact.subtitle")}</p>
        </div>
      </section>

      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: GraduationCap, value: stats?.studentsHelped ?? 0, label: t("home.stats.students") },
            { icon: UtensilsCrossed, value: stats?.mealsServed ?? 0, label: t("home.stats.meals") },
            { icon: Users, value: stats?.villagesReached ?? 0, label: t("home.stats.villages") },
            { icon: Heart, value: stats?.donationAmount ?? 0, label: t("impact.fundsRaised"), currency: true },
          ].map((item, index) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }} className="space-y-2">
              <item.icon className="w-8 h-8 text-primary mx-auto" />
              <p className="font-mono-stat text-3xl font-bold text-primary">
                {item.currency ? formatCurrency(item.value) : item.value.toLocaleString(locale)}
              </p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-8">{t("impact.allProjects")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => {
              const progress = Math.round((project.fundsUsed / project.budget) * 100);
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="admin-card space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      project.status === "ongoing" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>{project.status}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {project.location}</span>
                  </div>
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <p className="text-sm text-muted-foreground">{project.description}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{t("impact.budgetUtilization")}</span>
                      <span className="font-mono-stat font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatCurrency(project.fundsUsed)} {t("impact.used")}</span>
                      <span>{formatCurrency(project.budget)} {t("impact.total")}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary/5 text-center">
        <div className="container mx-auto px-4 space-y-4">
          <h2 className="text-2xl font-bold">{t("impact.cta")}</h2>
          <div className="flex justify-center gap-3">
            <Link to="/donate"><Button className="gap-2">{t("cta.donateNow")} <ArrowRight className="w-4 h-4" /></Button></Link>
            <Link to="/volunteer"><Button variant="outline">{t("cta.volunteer")}</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
