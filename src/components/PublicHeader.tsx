import { Link, useLocation } from "react-router-dom";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Language, useI18n } from "@/lib/i18n";

const languageOptions: Language[] = ["en", "bn", "hi", "ar"];

export default function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { t, language, setLanguage } = useI18n();

  const navLinks = [
    { label: t("nav.home"), href: "/" },
    { label: t("nav.about"), href: "/about" },
    { label: t("nav.work"), href: "/impact" },
    { label: t("nav.programs"), href: "/programs" },
    { label: t("nav.gallery"), href: "/gallery" },
    { label: t("nav.blog"), href: "/blog" },
    { label: t("nav.notices"), href: "/notices" },
    { label: t("nav.transparency"), href: "/transparency" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">{t("site.name")}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                "px-3 py-2 text-sm rounded-md transition-colors",
                location.pathname === link.href
                  ? "text-primary font-medium bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* CTA + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <label className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span>{t("language.label")}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground"
            >
              {languageOptions.map((key) => (
                <option key={key} value={key}>
                  {t(`lang.${key}`)}
                </option>
              ))}
            </select>
          </label>
          <Link to="/donate">
            <Button size="sm" className="hidden sm:inline-flex">{t("cta.donateNow")}</Button>
          </Link>
          <Link to="/volunteer">
            <Button variant="outline" size="sm" className="hidden md:inline-flex">{t("cta.volunteer")}</Button>
          </Link>
          <button
            className="lg:hidden p-2 text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2.5 text-sm rounded-md transition-colors",
                location.pathname === link.href
                  ? "text-primary font-medium bg-primary/5"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="flex gap-2 pt-3 border-t border-border mt-3">
            <Link to="/donate" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button className="w-full" size="sm">{t("cta.donateNow")}</Button>
            </Link>
            <Link to="/volunteer" className="flex-1" onClick={() => setMobileOpen(false)}>
              <Button variant="outline" className="w-full" size="sm">{t("cta.volunteer")}</Button>
            </Link>
          </div>
          <div className="pt-3 border-t border-border mt-3">
            <label className="text-xs text-muted-foreground block mb-1">{t("language.label")}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              {languageOptions.map((key) => (
                <option key={key} value={key}>
                  {t(`lang.${key}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </header>
  );
}
