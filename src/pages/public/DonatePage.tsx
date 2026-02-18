import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000];

export default function DonatePage() {
  const [amount, setAmount] = useState<number>(1000);
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");

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
            {/* Donation type */}
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

            {/* Amount presets */}
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
                    ₹{a.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">Or enter custom amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="custom-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="pl-8 font-mono-stat"
                  min={100}
                />
              </div>
            </div>

            {/* Donor info */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm font-medium mb-1 block">Full Name</Label>
                <Input id="name" placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium mb-1 block">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium mb-1 block">Phone (optional)</Label>
                <Input id="phone" placeholder="+91-XXXXXXXXXX" />
              </div>
            </div>

            <Button className="w-full gap-2 text-base py-6" size="lg">
              Donate ₹{amount.toLocaleString("en-IN")} {donationType === "monthly" ? "/ month" : ""} <ArrowRight className="w-4 h-4" />
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
