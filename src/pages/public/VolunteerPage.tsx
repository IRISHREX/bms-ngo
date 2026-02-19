import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Users, Briefcase, GraduationCap } from "lucide-react";
import { submitVolunteerForm } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

export default function VolunteerPage() {
  const [type, setType] = useState<"volunteer" | "partner" | "intern">("volunteer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const submitMutation = useMutation({
    mutationFn: submitVolunteerForm,
    onSuccess: () => {
      toast({ title: "Application submitted", description: "Thanks for joining our mission." });
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setType("volunteer");
    },
    onError: (error: Error) => toast({ title: "Submission failed", description: error.message, variant: "destructive" }),
  });

  const onSubmit = () => {
    if (!name.trim()) {
      toast({ title: "Missing field", description: "Full name is required.", variant: "destructive" });
      return;
    }

    submitMutation.mutate({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      message: message.trim(),
      type,
    });
  };

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Get Involved</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Join our mission - whether as a volunteer, partner, or intern</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-lg">
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

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card space-y-4">
            <h2 className="text-lg font-semibold capitalize">{type} Application</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-1 block">Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Email</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-XXXXXXXXXX" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  {type === "partner" ? "Organization & Partnership Details" : "Why do you want to join?"}
                </Label>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us about yourself..." rows={4} />
              </div>
            </div>
            <Button className="w-full" onClick={onSubmit} disabled={submitMutation.isPending}>
              {submitMutation.isPending ? "Submitting..." : "Submit Application"}
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
