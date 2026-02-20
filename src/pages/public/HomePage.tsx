import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { fetchDashboardStats, fetchProjects, fetchBlogPosts, fetchNotices, formatDate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { GraduationCap, UtensilsCrossed, MapPin, Users, Heart, ArrowRight, Pin } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
import CoverInitialsTile from "@/components/CoverInitialsTile";
import { useI18n } from "@/lib/i18n";

function AnimatedCounter({ value, suffix = "", locale }: { value: number; suffix?: string; locale: string }) {
  return (
    <span className="font-mono-stat text-4xl md:text-5xl font-bold text-primary">
      {value.toLocaleString(locale)}{suffix}
    </span>
  );
}

export default function HomePage() {
  const { t, locale } = useI18n();
  const { data: stats } = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchDashboardStats });
  const { data: projects } = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const { data: posts } = useQuery({ queryKey: ["blog-posts"], queryFn: fetchBlogPosts });
  const { data: notices } = useQuery({ queryKey: ["notices"], queryFn: fetchNotices });

  const publishedPosts = posts?.filter((p) => p.status === "published") ?? [];
  const pinnedNotices = notices?.filter((n) => n.pinned) ?? [];

  return (
    <div>
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Rural children studying in an open-air classroom" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/70 to-foreground/30" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl space-y-6"
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
              {t("home.hero.badge")}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold text-background leading-tight">{t("home.hero.title")}</h1>
            <p className="text-lg text-background/80 max-w-xl leading-relaxed">{t("home.hero.desc")}</p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/donate">
                <Button size="lg" className="gap-2 text-base px-8">
                  <Heart className="w-5 h-5" /> {t("cta.donateNow")}
                </Button>
              </Link>
              <Link to="/volunteer">
                <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-background/30 text-background hover:bg-background/10">
                  {t("home.hero.volunteer")}
                </Button>
              </Link>
              <Link to="/impact">
                <Button size="lg" variant="ghost" className="gap-2 text-base text-background/80 hover:text-background hover:bg-background/10">
                  {t("home.hero.work")} <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: GraduationCap, value: stats?.studentsHelped ?? 0, label: t("home.stats.students") },
              { icon: UtensilsCrossed, value: stats?.mealsServed ?? 0, label: t("home.stats.meals") },
              { icon: MapPin, value: stats?.villagesReached ?? 0, label: t("home.stats.villages"), suffix: "+" },
              { icon: Users, value: stats?.totalVolunteers ?? 0, label: t("home.stats.volunteers"), suffix: "+" },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="space-y-2"
              >
                <item.icon className="w-8 h-8 text-primary mx-auto" />
                <AnimatedCounter value={item.value} suffix={item.suffix} locale={locale} />
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">{t("home.work.title")}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{t("home.work.desc")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(projects ?? []).slice(0, 3).map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="admin-card space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    project.status === "ongoing" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {project.status}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {project.location}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{project.title}</h3>
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div className="pt-2 border-t border-border">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>{t("home.work.fundUtilization")}</span>
                    <span className="font-mono-stat">{Math.round((project.fundsUsed / project.budget) * 100)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${(project.fundsUsed / project.budget) * 100}%` }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/impact">
              <Button variant="outline" className="gap-2">{t("home.work.viewAll")} <ArrowRight className="w-4 h-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {pinnedNotices.length > 0 && (
        <section className="py-16 bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Pin className="w-5 h-5 text-primary" /> {t("home.notices.title")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pinnedNotices.map((notice) => (
                <div key={notice.id} className="bg-card rounded-lg border p-5 space-y-2">
                  <h3 className="font-semibold">{notice.title}</h3>
                  <p className="text-sm text-muted-foreground">{notice.description}</p>
                  <p className="text-xs text-muted-foreground">{t("home.notices.published", { date: formatDate(notice.publishDate) })}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link to="/notices"><Button variant="link" className="gap-1">{t("home.notices.all")} <ArrowRight className="w-4 h-4" /></Button></Link>
            </div>
          </div>
        </section>
      )}

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">{t("home.blog.title")}</h2>
            <p className="text-muted-foreground">{t("home.blog.desc")}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publishedPosts.slice(0, 3).map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="admin-card space-y-3"
              >
                {post.coverImage ? (
                  <img src={post.coverImage} alt={post.title} className="aspect-video w-full object-cover rounded-md" />
                ) : (
                  <CoverInitialsTile title={post.title} />
                )}
                <div className="flex gap-2">{post.tags.map((tag) => <span key={tag} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">{tag}</span>)}</div>
                <h3 className="text-lg font-semibold">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                <p className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</p>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/blog"><Button variant="outline" className="gap-2">{t("home.blog.readAll")} <ArrowRight className="w-4 h-4" /></Button></Link>
          </div>
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <h2 className="text-3xl md:text-4xl font-bold">{t("home.cta.title")}</h2>
            <p className="text-lg opacity-90">{t("home.cta.desc")}</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/donate"><Button size="lg" variant="secondary" className="text-base px-8">{t("cta.donateNow")}</Button></Link>
              <Link to="/volunteer"><Button size="lg" variant="outline" className="text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">{t("cta.volunteer")}</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
