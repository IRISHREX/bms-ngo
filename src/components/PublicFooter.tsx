import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export default function PublicFooter() {
  const { t } = useI18n();

  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">{t("site.name")}</span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">{t("footer.tagline")}</p>
            <div className="space-y-2 text-sm opacity-70">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> contact@hopefoundation.org</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91-9876543210</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Kolkata, West Bengal, India</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">{t("footer.quickLinks")}</h3>
            <div className="space-y-2">
              {[
                { label: t("nav.about"), href: "/about" },
                { label: t("nav.work"), href: "/impact" },
                { label: t("nav.programs"), href: "/programs" },
                { label: t("nav.gallery"), href: "/gallery" },
                { label: t("nav.blog"), href: "/blog" },
              ].map((link) => (
                <Link key={link.href} to={link.href} className="block text-sm opacity-70 hover:opacity-100 transition-opacity">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">{t("footer.getInvolved")}</h3>
            <div className="space-y-2">
              {[
                { label: t("cta.donateNow"), href: "/donate" },
                { label: t("cta.volunteer"), href: "/volunteer" },
                { label: t("footer.partner"), href: "/volunteer" },
                { label: t("nav.notices"), href: "/notices" },
              ].map((link) => (
                <Link key={link.label} to={link.href} className="block text-sm opacity-70 hover:opacity-100 transition-opacity">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">{t("footer.transparency")}</h3>
            <div className="space-y-2 text-sm opacity-70">
              <p>NGO Reg: XXXXX/2021</p>
              <p>80G Certificate: Available</p>
              <p>12A Registration: Available</p>
              <Link to="/transparency" className="block hover:opacity-100 transition-opacity">
                {t("footer.reports")} -&gt;
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-sm opacity-50">
          {new Date().getFullYear()} {t("site.name")}. {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
