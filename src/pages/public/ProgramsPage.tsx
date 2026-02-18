import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Stethoscope, UtensilsCrossed, Users, ArrowRight } from "lucide-react";

const programs = [
  {
    id: "education",
    title: "Education Program",
    icon: GraduationCap,
    desc: "Free quality education for rural children through learning centers, scholarships, and mentorship.",
    highlights: ["500+ students enrolled", "15 learning centers", "100% first-generation learners"],
  },
  {
    id: "medical",
    title: "Medical Camps",
    icon: Stethoscope,
    desc: "Monthly free health checkup camps in underserved villages with medicines and referral support.",
    highlights: ["Monthly camps", "Free medicines", "Specialist referrals"],
  },
  {
    id: "food",
    title: "Food Distribution",
    icon: UtensilsCrossed,
    desc: "Regular food distribution drives ensuring no family goes hungry in our served communities.",
    highlights: ["15,000+ meals served", "Weekly drives", "Nutrition support"],
  },
  {
    id: "women",
    title: "Women Empowerment",
    icon: Users,
    desc: "Skill development, micro-finance, and leadership training for rural women.",
    highlights: ["Skill workshops", "Micro-finance access", "Self-help groups"],
  },
];

export default function ProgramsPage() {
  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Programs</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Four focused initiatives creating lasting change across rural India</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 space-y-8">
          {programs.map((program, i) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
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
                    {program.highlights.map((h) => (
                      <span key={h} className="px-3 py-1 rounded-full text-xs bg-primary/5 text-primary border border-primary/10">
                        {h}
                      </span>
                    ))}
                  </div>
                  <Link to="/volunteer">
                    <Button variant="outline" size="sm" className="gap-1 mt-2">
                      Volunteer for this program <ArrowRight className="w-3 h-3" />
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
