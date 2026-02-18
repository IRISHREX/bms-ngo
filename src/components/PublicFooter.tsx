import { Link } from "react-router-dom";
import { Heart, Mail, Phone, MapPin } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">HopeFoundation</span>
            </div>
            <p className="text-sm opacity-70 leading-relaxed">
              Providing free education, healthcare, and empowerment to rural communities since 2021.
            </p>
            <div className="space-y-2 text-sm opacity-70">
              <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> contact@hopefoundation.org</div>
              <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> +91-9876543210</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Kolkata, West Bengal, India</div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Quick Links</h3>
            <div className="space-y-2">
              {[
                { label: "About Us", href: "/about" },
                { label: "Our Work", href: "/impact" },
                { label: "Programs", href: "/programs" },
                { label: "Gallery", href: "/gallery" },
                { label: "Blog", href: "/blog" },
              ].map((link) => (
                <Link key={link.href} to={link.href} className="block text-sm opacity-70 hover:opacity-100 transition-opacity">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Get Involved */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Get Involved</h3>
            <div className="space-y-2">
              {[
                { label: "Donate", href: "/donate" },
                { label: "Volunteer", href: "/volunteer" },
                { label: "Partner With Us", href: "/volunteer" },
                { label: "Notices", href: "/notices" },
              ].map((link) => (
                <Link key={link.label} to={link.href} className="block text-sm opacity-70 hover:opacity-100 transition-opacity">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Transparency</h3>
            <div className="space-y-2 text-sm opacity-70">
              <p>NGO Reg: XXXXX/2021</p>
              <p>80G Certificate: Available</p>
              <p>12A Registration: Available</p>
              <Link to="/transparency" className="block hover:opacity-100 transition-opacity">
                View Annual Reports →
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-sm opacity-50">
          © {new Date().getFullYear()} HopeFoundation. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
