import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Heart, ArrowRight } from "lucide-react";
import { createDonation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000];

export default function DonatePage() {
  const [amount, setAmount] = useState<number>(1000);
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const donateMutation = useMutation({
    mutationFn: createDonation,
    onSuccess: () => {
      toast({ title: "Donation submitted", description: "Thank you for your support." });
      setName("");
      setEmail("");
      setPhone("");
      setAmount(1000);
      setDonationType("one-time");
    },
    onError: (error: Error) => toast({ title: "Donation failed", description: error.message, variant: "destructive" }),
  });

  const submitDonation = () => {
    if (!name.trim()) {
      toast({ title: "Missing field", description: "Full name is required.", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(amount) || amount < 100) {
      toast({ title: "Invalid amount", description: "Minimum donation is INR 100.", variant: "destructive" });
      return;
    }

    donateMutation.mutate({
      donorName: name.trim(),
      amount: Number(amount),
      type: donationType,
      paymentId: `WEB-${Date.now()}`,
      campaign: donationType === "monthly" ? "monthly-giving" : undefined,
    });
  };

  return (
    <div>
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <Heart className="w-12 h-12 mx-auto" />
            <h1 className="text-4xl font-bold">Make a Donation</h1>
            <p className="text-lg opacity-90 max-w-md mx-auto">
              Your contribution directly funds education, healthcare, and food for rural communities.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="admin-card space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">Donation Type</Label>
              <div className="flex gap-2">
                {(["one-time", "monthly"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDonationType(type)}
                    className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      donationType === type ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {type === "one-time" ? "One-time" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">Select Amount</Label>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAmount(a)}
                    className={`py-3 rounded-md text-sm font-medium font-mono-stat transition-colors ${
                      amount === a ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    INR {a.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">Or enter custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">INR</span>
                <Input
                  id="custom-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="pl-12 font-mono-stat"
                  min={100}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm font-medium mb-1 block">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium mb-1 block">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium mb-1 block">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-XXXXXXXXXX" />
              </div>
            </div>

            <Button className="w-full gap-2 text-base py-6" size="lg" onClick={submitDonation} disabled={donateMutation.isPending}>
              {donateMutation.isPending ? "Submitting..." : `Donate INR ${amount.toLocaleString("en-IN")}${donationType === "monthly" ? " / month" : ""}`}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              80G tax exemption receipt will be sent to your email. All donations are tax-deductible.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
