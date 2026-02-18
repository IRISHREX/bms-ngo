import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function VolunteerPage() {
  const [type, setType] = useState<"volunteer" | "partner" | "intern">("volunteer");

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Get Involved</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Join our mission — whether as a volunteer, partner, or intern</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {([
              { key: "volunteer" as const, label: "Volunteer", icon: Users },
              { key: "partner" as const, label: "Partner", icon: Briefcase },
              { key: "intern" as const, label: "Intern", icon: GraduationCap },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setType(t.key)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors ${
                  type === t.key ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                <t.icon className="w-6 h-6" />
                <span className="text-sm font-medium">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card space-y-4">
            <h2 className="text-lg font-semibold capitalize">{type} Application</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-1 block">Full Name</Label>
                <Input placeholder="Your full name" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Email</Label>
                <Input type="email" placeholder="your@email.com" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Phone</Label>
                <Input placeholder="+91-XXXXXXXXXX" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  {type === "partner" ? "Organization & Partnership Details" : "Why do you want to join?"}
                </Label>
                <Textarea placeholder="Tell us about yourself..." rows={4} />
              </div>
            </div>
            <Button className="w-full">Submit Application</Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
