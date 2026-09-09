import { useState, useRef } from "react";
import { generateVolunteerPdf } from "@/lib/pdfGenerator";
import { motion } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Users, Briefcase, GraduationCap } from "lucide-react";
import { submitVolunteerForm } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export default function VolunteerPage() {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  
  const submitMutation = useMutation({
    mutationFn: submitVolunteerForm,
    onSuccess: (data, variables) => {
      toast({ title: t("volunteer.toast.successTitle"), description: t("volunteer.toast.successDesc") });
      
      try {
        const vData: Record<string, any> = {};
        variables.forEach((value, key) => {
          vData[key] = value;
        });
        
        if (data && data.application_no) {
          vData.applicationNo = data.application_no;
        }

        generateVolunteerPdf(vData);
      } catch (err) {
        console.error("Failed to generate PDF", err);
      }

      if (formRef.current) formRef.current.reset();
    },
    onError: (error: Error) => toast({ title: t("volunteer.toast.failedTitle"), description: error.message, variant: "destructive" }),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("full_name") as string;
    
    if (!fullName?.trim()) {
      toast({ title: t("volunteer.toast.missingTitle"), description: t("volunteer.toast.missingDesc"), variant: "destructive" });
      return;
    }

    submitMutation.mutate(formData);
  };

  return (
    <div>
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">{t("volunteer.form.title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("volunteer.subtitle")}</p>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card p-8">
            <form ref={formRef} onSubmit={onSubmit} className="space-y-12">
              
              {/* SECTION A: Personal Info */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">{t("volunteer.form.personalInfo")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.fullName")} *</Label>
                    <Input name="full_name" required placeholder={t("volunteer.form.fullName")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.fatherName")}</Label>
                    <Input name="father_name" placeholder={t("volunteer.form.fatherName")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.motherName")}</Label>
                    <Input name="mother_name" placeholder={t("volunteer.form.motherName")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.dob")}</Label>
                    <Input name="dob" type="date" />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.gender")}</Label>
                    <select name="gender" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      <option value="">--</option>
                      <option value="male">{t("volunteer.form.male")}</option>
                      <option value="female">{t("volunteer.form.female")}</option>
                      <option value="other">{t("volunteer.form.other")}</option>
                    </select>
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.age")}</Label>
                    <Input name="age" type="number" min="0" placeholder={t("volunteer.form.age")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.maritalStatus")}</Label>
                    <select name="marital_status" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      <option value="">--</option>
                      <option value="married">{t("volunteer.form.married")}</option>
                      <option value="unmarried">{t("volunteer.form.unmarried")}</option>
                      <option value="other">{t("volunteer.form.other")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION B: Contact & Address */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">{t("volunteer.form.contactAddr")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.mobileNo")} *</Label>
                    <Input name="mobile_no" required placeholder={t("volunteer.form.mobileNo")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.whatsappNo")}</Label>
                    <Input name="whatsapp_no" placeholder={t("volunteer.form.whatsappNo")} />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">{t("volunteer.form.email")}</Label>
                    <Input name="email" type="email" placeholder={t("volunteer.form.email")} />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="mb-2 block">{t("volunteer.form.fullAddress")}</Label>
                    <Textarea name="address" rows={3} placeholder={t("volunteer.form.fullAddress")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.village")}</Label>
                    <Input name="village" placeholder={t("volunteer.form.village")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.postOffice")}</Label>
                    <Input name="post_office" placeholder={t("volunteer.form.postOffice")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.policeStation")}</Label>
                    <Input name="police_station" placeholder={t("volunteer.form.policeStation")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.district")}</Label>
                    <Input name="district" placeholder={t("volunteer.form.district")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.pinCode")}</Label>
                    <Input name="pin_code" placeholder={t("volunteer.form.pinCode")} />
                  </div>
                </div>
              </div>

              {/* SECTION C: Education & Occupation */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">{t("volunteer.form.eduOcc")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.education")}</Label>
                    <select name="education" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      <option value="">--</option>
                      <option value="Primary">{t("volunteer.form.edu.primary")}</option>
                      <option value="Madhyamik">{t("volunteer.form.edu.madhyamik")}</option>
                      <option value="Higher Secondary">{t("volunteer.form.edu.hs")}</option>
                      <option value="Graduate">{t("volunteer.form.edu.graduate")}</option>
                      <option value="Post Graduate">{t("volunteer.form.edu.pg")}</option>
                      <option value="Other">{t("volunteer.form.other")}</option>
                    </select>
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.occupation")}</Label>
                    <Input name="occupation" placeholder={t("volunteer.form.occupation")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.aadhaarNo")}</Label>
                    <Input name="aadhaar_no" placeholder={t("volunteer.form.aadhaarNo")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.panNo")}</Label>
                    <Input name="pan_no" placeholder={t("volunteer.form.panNo")} />
                  </div>
                </div>
              </div>

              {/* SECTION D: Membership Details */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">{t("volunteer.form.memDetails")}</h2>
                <div className="space-y-6">
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.whyJoin")}</Label>
                    <Textarea name="join_reason" rows={3} placeholder={t("volunteer.form.whyJoin")} />
                  </div>
                  <div>
                    <Label className="mb-3 block font-semibold">{t("volunteer.form.socialInterest")}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { val: "Blood Donation", label: t("volunteer.form.interest.blood") },
                        { val: "Health Service", label: t("volunteer.form.interest.health") },
                        { val: "Education", label: t("volunteer.form.interest.edu") },
                        { val: "Helping Poor", label: t("volunteer.form.interest.help") },
                        { val: "Child Welfare", label: t("volunteer.form.interest.child") },
                        { val: "Women Welfare", label: t("volunteer.form.interest.women") },
                        { val: "Agriculture", label: t("volunteer.form.interest.agri") },
                        { val: "Environment", label: t("volunteer.form.interest.env") },
                        { val: "Disaster Relief", label: t("volunteer.form.interest.disaster") },
                      ].map((item) => (
                        <label key={item.val} className="flex items-center space-x-2 text-sm">
                          <input type="checkbox" name="social_work_interest" value={item.val} className="rounded border-input text-primary focus:ring-primary" />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.prevExp")}</Label>
                    <Textarea name="previous_experience" rows={2} placeholder={t("volunteer.form.prevExp")} />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.memType")}</Label>
                    <select name="membership_type" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm">
                      <option value="">--</option>
                      <option value="General Member">{t("volunteer.form.mem.general")}</option>
                      <option value="Active Member">{t("volunteer.form.mem.active")}</option>
                      <option value="Volunteer">{t("volunteer.form.mem.volunteer")}</option>
                      <option value="Life Member">{t("volunteer.form.mem.life")}</option>
                      <option value="Other">{t("volunteer.form.other")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION E: Documents */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold border-b pb-2">{t("volunteer.form.docs")}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.photo")}</Label>
                    <Input name="photo_file" type="file" accept="image/*" />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.aadhaarCopy")}</Label>
                    <Input name="aadhaar_file" type="file" accept="image/*,.pdf" />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.addrProof")}</Label>
                    <Input name="address_proof_file" type="file" accept="image/*,.pdf" />
                  </div>
                  <div>
                    <Label className="mb-2 block">{t("volunteer.form.otherDoc")}</Label>
                    <Input name="other_doc_file" type="file" accept="image/*,.pdf" />
                  </div>
                </div>
              </div>

              {/* SECTION F: Declaration */}
              <div className="space-y-6 bg-muted/30 p-6 rounded-lg border">
                <h2 className="text-lg font-semibold">{t("volunteer.form.declaration")}</h2>
                <label className="flex items-start space-x-3 text-sm">
                  <input type="checkbox" required className="mt-1 rounded border-input text-primary focus:ring-primary" />
                  <span className="leading-relaxed text-muted-foreground">{t("volunteer.form.declarationText")}</span>
                </label>
              </div>

              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full text-lg h-12" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? t("volunteer.submitting") : t("volunteer.submit")}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
