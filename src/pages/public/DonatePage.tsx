import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Heart, ArrowRight } from "lucide-react";
import { createDonation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const presetAmounts = [500, 1000, 2500, 5000, 10000, 25000];

export default function DonatePage() {
  const { t, locale } = useI18n();
  const [amount, setAmount] = useState<number>(1000);
  const [donationType, setDonationType] = useState<"one-time" | "monthly">("one-time");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const donateMutation = useMutation({
    mutationFn: createDonation,
    onSuccess: () => {
      toast({ title: t("donate.toast.successTitle"), description: t("donate.toast.successDesc") });
      setName("");
      setEmail("");
      setPhone("");
      setAmount(1000);
      setDonationType("one-time");
    },
    onError: (error: Error) => toast({ title: t("donate.toast.failedTitle"), description: error.message, variant: "destructive" }),
  });

  const submitDonation = () => {
    if (!name.trim()) {
      toast({ title: t("donate.toast.missingTitle"), description: t("donate.toast.missingDesc"), variant: "destructive" });
      return;
    }
    if (!Number.isFinite(amount) || amount < 100) {
      toast({ title: t("donate.toast.invalidTitle"), description: t("donate.toast.invalidDesc"), variant: "destructive" });
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
            <h1 className="text-4xl font-bold">{t("donate.title")}</h1>
            <p className="text-lg opacity-90 max-w-md mx-auto">{t("donate.subtitle")}</p>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="admin-card space-y-6">
            <div>
              <Label className="text-sm font-medium mb-3 block">{t("donate.type")}</Label>
              <div className="flex gap-2">
                {(["one-time", "monthly"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setDonationType(type)}
                    className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      donationType === type ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {type === "one-time" ? t("donate.oneTime") : t("donate.monthly")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">{t("donate.selectAmount")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((value) => (
                  <button
                    key={value}
                    onClick={() => setAmount(value)}
                    className={`py-3 rounded-md text-sm font-medium font-mono-stat transition-colors ${
                      amount === value ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    INR {value.toLocaleString(locale)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="custom-amount" className="text-sm font-medium mb-2 block">{t("donate.customAmount")}</Label>
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
                <Label htmlFor="name" className="text-sm font-medium mb-1 block">{t("donate.fullName")}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium mb-1 block">{t("donate.email")}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm font-medium mb-1 block">{t("donate.phoneOptional")}</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91-XXXXXXXXXX" />
              </div>
            </div>

            <Button className="w-full gap-2 text-base py-6" size="lg" onClick={submitDonation} disabled={donateMutation.isPending}>
              {donateMutation.isPending
                ? t("donate.submitting")
                : `${t("donate.submit", { amount: amount.toLocaleString(locale) })}${donationType === "monthly" ? ` ${t("donate.submitMonthlySuffix")}` : ""}`}
              <ArrowRight className="w-4 h-4" />
            </Button>

            <p className="text-xs text-muted-foreground text-center">{t("donate.taxNote")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
