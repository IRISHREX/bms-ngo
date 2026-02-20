import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Stethoscope, UtensilsCrossed, Users, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function ProgramsPage() {
  const { t } = useI18n();

  const programs = [
    {
      id: "education",
      title: t("programs.education.title"),
      icon: GraduationCap,
      desc: t("programs.education.desc"),
      highlights: [t("programs.education.h1"), t("programs.education.h2"), t("programs.education.h3")],
    },
    {
      id: "medical",
      title: t("programs.medical.title"),
      icon: Stethoscope,
      desc: t("programs.medical.desc"),
      highlights: [t("programs.medical.h1"), t("programs.medical.h2"), t("programs.medical.h3")],
    },
    {
      id: "food",
      title: t("programs.food.title"),
      icon: UtensilsCrossed,
      desc: t("programs.food.desc"),
      highlights: [t("programs.food.h1"), t("programs.food.h2"), t("programs.food.h3")],
    },
    {
      id: "women",
      title: t("programs.women.title"),
      icon: Users,
      desc: t("programs.women.desc"),
      highlights: [t("programs.women.h1"), t("programs.women.h2"), t("programs.women.h3")],
    },
  ];

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("programs.title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("programs.subtitle")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 space-y-8">
          {programs.map((program, index) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="admin-card"
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <program.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 space-y-3">
                  <h2 className="text-xl font-bold">{program.title}</h2>
                  <p className="text-muted-foreground">{program.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    {program.highlights.map((highlight) => (
                      <span key={highlight} className="px-3 py-1 rounded-full text-xs bg-primary/5 text-primary border border-primary/10">
                        {highlight}
                      </span>
                    ))}
                  </div>
                  <Link to="/volunteer">
                    <Button variant="outline" size="sm" className="gap-1 mt-2">
                      {t("programs.volunteerCta")} <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
