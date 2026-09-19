import { useState, useRef, ChangeEvent } from "react";
import { generateVolunteerPdf } from "@/lib/pdfGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { Camera, Upload, CheckCircle2, FileDown, Printer, RefreshCw, X, AlertCircle } from "lucide-react";
import { submitVolunteerForm } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export default function VolunteerPage() {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Top-right photo state & preview
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form field states for instant real-time validation & auto calculation
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [calculatedAge, setCalculatedAge] = useState<number | "">("");
  const [mobileNo, setMobileNo] = useState("");
  const [whatsappNo, setWhatsappNo] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [aadhaarNo, setAadhaarNo] = useState("");

  // File tracking for UI feedback (showing file names & sizes)
  const [fileDetails, setFileDetails] = useState<{
    aadhaar?: { name: string; size: string };
    address?: { name: string; size: string };
    other?: { name: string; size: string };
  }>({});

  // Submitted application record state for persistent download
  const [submittedData, setSubmittedData] = useState<Record<string, any> | null>(null);

  // Auto-calculate age whenever DOB changes
  const handleDobChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDob(val);
    if (!val) {
      setCalculatedAge("");
      return;
    }
    const birthDate = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    setCalculatedAge(age >= 0 ? age : 0);
  };

  const handlePhotoSelect = (file: File | null) => {
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid image format",
        description: "Please select a JPG, PNG, or WebP image for your passport photo.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Photo size exceeds 5 MB limit",
        description: `Selected photo is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Max allowed is 5 MB.`,
        variant: "destructive"
      });
      if (photoInputRef.current) photoInputRef.current.value = "";
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoFile(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleDocumentChange = (key: "aadhaar" | "address" | "other", e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFileDetails((prev) => ({ ...prev, [key]: undefined }));
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File size exceeds 5 MB limit",
        description: `"${file.name}" is ${(file.size / (1024 * 1024)).toFixed(1)} MB. Max allowed is 5 MB.`,
        variant: "destructive"
      });
      e.target.value = "";
      setFileDetails((prev) => ({ ...prev, [key]: undefined }));
      return;
    }

    const sizeStr = file.size < 1024 * 1024
      ? `${Math.round(file.size / 1024)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    setFileDetails((prev) => ({
      ...prev,
      [key]: { name: file.name, size: sizeStr }
    }));
  };

  const submitMutation = useMutation({
    mutationFn: submitVolunteerForm,
    onSuccess: async (data, variables) => {
      toast({ title: t("volunteer.toast.successTitle"), description: t("volunteer.toast.successDesc") });
      
      const vData: Record<string, any> = {};
      variables.forEach((value, key) => {
        if (key.endsWith("[]")) {
          const cleanKey = key.slice(0, -2);
          if (!vData[cleanKey]) vData[cleanKey] = [];
          vData[cleanKey].push(value);
        } else {
          vData[key] = value;
        }
      });
      
      if (data && data.application_no) {
        vData.applicationNo = data.application_no;
      }
      if (photoPreview) {
        vData.photoDataUrl = photoPreview;
      }
      if (calculatedAge !== "") {
        vData.age = calculatedAge;
      }

      setSubmittedData(vData);

      try {
        await generateVolunteerPdf(vData);
      } catch (err) {
        console.error("Failed to generate PDF", err);
      }

      setTimeout(() => {
        const target = document.getElementById("submission-summary");
        if (target) {
          target.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
    },
    onError: (error: Error) => toast({ title: t("volunteer.toast.failedTitle"), description: error.message, variant: "destructive" }),
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("full_name") as string)?.trim();
    const phone = (formData.get("mobile_no") as string)?.trim();

    // 1. Name validation (alphabetic & spaces only)
    if (!name || !/^[a-zA-Z\s.]+$/.test(name)) {
      toast({
        title: "Invalid Name",
        description: "Full Name should only contain letters, dots, and spaces.",
        variant: "destructive"
      });
      return;
    }

    // 2. Mobile validation (10 digits starting with 6-9)
    if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
      toast({
        title: "Invalid Mobile Number",
        description: "Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).",
        variant: "destructive"
      });
      return;
    }

    // 3. WhatsApp validation if filled
    const wa = (formData.get("whatsapp_no") as string)?.trim();
    if (wa && !/^[6-9]\d{9}$/.test(wa)) {
      toast({
        title: "Invalid WhatsApp Number",
        description: "WhatsApp number must be a valid 10-digit mobile number.",
        variant: "destructive"
      });
      return;
    }

    // 4. Age validation
    if (calculatedAge !== "" && (calculatedAge < 18 || calculatedAge > 100)) {
      toast({
        title: "Age Eligibility",
        description: "Volunteers must be at least 18 years of age.",
        variant: "destructive"
      });
      return;
    }

    // 5. PIN code validation if filled
    const pin = (formData.get("pin_code") as string)?.trim();
    if (pin && !/^\d{6}$/.test(pin)) {
      toast({
        title: "Invalid PIN Code",
        description: "PIN Code must be exactly 6 digits.",
        variant: "destructive"
      });
      return;
    }

    // 6. Aadhaar validation if filled
    const aadh = (formData.get("aadhaar_no") as string)?.trim();
    if (aadh && !/^\d{12}$/.test(aadh.replace(/\s+/g, ""))) {
      toast({
        title: "Invalid Aadhaar Number",
        description: "Aadhaar number must be 12 digits.",
        variant: "destructive"
      });
      return;
    }

    // Attach calculated age
    if (calculatedAge !== "") {
      formData.set("age", calculatedAge.toString());
    }

    // Attach top-right photo if selected
    if (photoFile) {
      formData.set("photo_file", photoFile);
    }

    // Automatically construct readable full address from separate fields
    const street = formData.get("village") as string;
    const po = formData.get("post_office") as string;
    const ps = formData.get("police_station") as string;
    const dist = formData.get("district") as string;
    const combinedAddr = [
      street ? `Vill/Street: ${street}` : null,
      po ? `P.O: ${po}` : null,
      ps ? `P.S: ${ps}` : null,
      dist ? `Dist: ${dist}` : null,
      pin ? `PIN: ${pin}` : null
    ].filter(Boolean).join(", ");
    formData.set("address", combinedAddr);

    submitMutation.mutate(formData);
  };

  const handleDownloadBlankPdf = async () => {
    await generateVolunteerPdf({
      fullName: "",
      applicationNo: "BLANK-FORM-PREVIEW",
      status: "Blank Form"
    });
  };

  const handleResetForm = () => {
    setSubmittedData(null);
    setPhotoPreview(null);
    setPhotoFile(null);
    setFileDetails({});
    setFullName("");
    setDob("");
    setCalculatedAge("");
    setMobileNo("");
    setWhatsappNo("");
    setPinCode("");
    setAadhaarNo("");
    if (formRef.current) formRef.current.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div>
      <section className="py-16 bg-muted/50 border-b">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">{t("volunteer.form.title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("volunteer.subtitle")}</p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="admin-card p-6 md:p-10 shadow-sm border rounded-xl">
            
            <form ref={formRef} onSubmit={onSubmit} className="space-y-12">
              
              {/* SECTION A: Personal Info with Top-Right Photo Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{t("volunteer.form.personalInfo")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Please provide your legal personal and identity details</p>
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    Section A
                  </span>
                </div>

                {/* Grid with Personal Info on Left, Official Passport Photo Box on Top-Right */}
                <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
                  
                  {/* Form fields */}
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <Label className="mb-2 block font-medium">{t("volunteer.form.fullName")} *</Label>
                      <Input
                        name="full_name"
                        required
                        value={fullName}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "" || /^[a-zA-Z\s.]*$/.test(val)) {
                            setFullName(val);
                          }
                        }}
                        placeholder="Letters and spaces only (e.g. Sohel Islam)"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block font-medium">{t("volunteer.form.fatherName")}</Label>
                      <Input name="father_name" placeholder={t("volunteer.form.fatherName")} />
                    </div>

                    <div>
                      <Label className="mb-2 block font-medium">{t("volunteer.form.motherName")}</Label>
                      <Input name="mother_name" placeholder={t("volunteer.form.motherName")} />
                    </div>

                    <div>
                      <Label className="mb-2 block font-medium">{t("volunteer.form.dob")} *</Label>
                      <Input
                        name="dob"
                        type="date"
                        required
                        value={dob}
                        max={new Date().toISOString().split("T")[0]}
                        onChange={handleDobChange}
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block font-medium">Age (Auto-Calculated from DOB)</Label>
                      <Input
                        name="age_display"
                        readOnly
                        value={calculatedAge !== "" ? `${calculatedAge} years` : "Select Date of Birth"}
                        className="bg-muted font-medium cursor-not-allowed text-primary"
                      />
                    </div>

                    <div>
                      <Label className="mb-2 block font-medium">{t("volunteer.form.gender")}</Label>
                      <select name="gender" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary">
                        <option value="">-- Select Gender --</option>
                        <option value="male">{t("volunteer.form.male")}</option>
                        <option value="female">{t("volunteer.form.female")}</option>
                        <option value="other">{t("volunteer.form.other")}</option>
                      </select>
                    </div>

                    <div>
                      <Label className="mb-2 block font-medium">{t("volunteer.form.maritalStatus")}</Label>
                      <select name="marital_status" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary">
                        <option value="">-- Select Status --</option>
                        <option value="married">{t("volunteer.form.married")}</option>
                        <option value="unmarried">{t("volunteer.form.unmarried")}</option>
                        <option value="other">{t("volunteer.form.other")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Top-Right Passport Photo Box */}
                  <div className="w-full sm:w-auto flex flex-col items-center sm:items-end self-center lg:self-start">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Passport Photo
                        </Label>
                        <span className="text-[10px] text-primary font-bold">(Max 5 MB)</span>
                      </div>
                      
                      <div
                        onClick={() => photoInputRef.current?.click()}
                        className={`relative w-36 h-44 rounded-lg border-2 ${
                          photoPreview ? "border-primary shadow-sm" : "border-dashed border-border hover:border-primary/70"
                        } bg-muted/20 hover:bg-muted/40 transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden group select-none`}
                        title="Click to select applicant photo (Max 5 MB)"
                      >
                        {photoPreview ? (
                          <>
                            <img
                              src={photoPreview}
                              alt="Passport Photo Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                              <Camera className="w-6 h-6 mb-1" />
                              <span className="text-[11px] font-medium">Change Photo</span>
                            </div>
                            <button
                              type="button"
                              onClick={removePhoto}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full shadow hover:bg-destructive/90 transition-colors z-10"
                              title="Remove Photo"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center p-3 text-muted-foreground group-hover:text-primary transition-colors">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                              <Camera className="w-6 h-6 opacity-70" />
                            </div>
                            <span className="text-xs font-semibold text-foreground">Upload Photo</span>
                            <span className="text-[10px] text-muted-foreground mt-0.5">3.5 × 4.5 cm</span>
                            <span className="text-[9px] text-primary/80 mt-1 font-medium">Embedded in PDF</span>
                          </div>
                        )}
                      </div>

                      {/* Hidden File Input for the Top-Right Photo */}
                      <input
                        ref={photoInputRef}
                        name="photo_file"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          const file = e.target.files?.[0] || null;
                          handlePhotoSelect(file);
                        }}
                      />

                      <p className="text-[11px] text-muted-foreground mt-2 text-center max-w-[150px]">
                        {photoFile ? `${photoFile.name} (${Math.round(photoFile.size / 1024)} KB)` : "JPG / PNG (Max 5 MB)"}
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION B: Contact & Separated Structured Address Fields */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{t("volunteer.form.contactAddr")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Communication numbers and permanent residence details</p>
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    Section B
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="mb-2 block font-medium">{t("volunteer.form.mobileNo")} * (10 Digits)</Label>
                    <Input
                      name="mobile_no"
                      required
                      value={mobileNo}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setMobileNo(val);
                      }}
                      placeholder="10-digit number (e.g. 9609436103)"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">{t("volunteer.form.whatsappNo")} (10 Digits)</Label>
                    <Input
                      name="whatsapp_no"
                      value={whatsappNo}
                      maxLength={10}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setWhatsappNo(val);
                      }}
                      placeholder="10-digit WhatsApp number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="mb-2 block font-medium">{t("volunteer.form.email")}</Label>
                    <Input name="email" type="email" placeholder="example@email.com" />
                  </div>

                  {/* Clean Separate Address Options (no duplicate redundant Full Address textarea) */}
                  <div>
                    <Label className="mb-2 block font-medium">Village / Street / House No.</Label>
                    <Input name="village" placeholder="e.g. Tarbagan, Dhuliyan" />
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">Post Office (P.O)</Label>
                    <Input name="post_office" placeholder="e.g. Farakka" />
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">Police Station (P.S)</Label>
                    <Input name="police_station" placeholder="e.g. Samserganj" />
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">District</Label>
                    <Input name="district" defaultValue="Murshidabad" placeholder="e.g. Murshidabad" />
                  </div>

                  <div className="md:col-span-2 sm:w-1/2">
                    <Label className="mb-2 block font-medium">PIN Code (6 Digits)</Label>
                    <Input
                      name="pin_code"
                      value={pinCode}
                      maxLength={6}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPinCode(val);
                      }}
                      placeholder="6-digit PIN code (e.g. 742202)"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: Education & Identification */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{t("volunteer.form.eduOcc")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Educational qualifications and government IDs</p>
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    Section C
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label className="mb-2 block font-medium">{t("volunteer.form.education")}</Label>
                    <select name="education" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary">
                      <option value="">-- Select Education --</option>
                      <option value="Primary">{t("volunteer.form.edu.primary")}</option>
                      <option value="Secondary">{t("volunteer.form.edu.secondary")}</option>
                      <option value="Higher Secondary">{t("volunteer.form.edu.higherSec")}</option>
                      <option value="Graduate">{t("volunteer.form.edu.graduate")}</option>
                      <option value="Post Graduate">{t("volunteer.form.edu.postGraduate")}</option>
                      <option value="Other">{t("volunteer.form.other")}</option>
                    </select>
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">{t("volunteer.form.occupation")}</Label>
                    <Input name="occupation" placeholder="e.g. Student, Social Worker, Teacher" />
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">Aadhaar Number (12 Digits)</Label>
                    <Input
                      name="aadhaar_no"
                      value={aadhaarNo}
                      maxLength={12}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setAadhaarNo(val);
                      }}
                      placeholder="12-digit Aadhaar number"
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">PAN Number (Optional)</Label>
                    <Input name="pan_no" maxLength={10} placeholder="10-character PAN (e.g. ABCDE1234F)" className="uppercase" />
                  </div>
                </div>
              </div>

              {/* SECTION D: Membership Details */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{t("volunteer.form.memDetails")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Your motivation and social work interests</p>
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    Section D
                  </span>
                </div>

                <div className="space-y-5">
                  <div>
                    <Label className="mb-2 block font-medium">{t("volunteer.form.whyJoin")}</Label>
                    <Textarea name="join_reason" rows={2} placeholder={t("volunteer.form.whyJoin")} />
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
                        <label key={item.val} className="flex items-center space-x-2 text-sm p-2 rounded border bg-card/40 hover:bg-muted/50 cursor-pointer transition-colors">
                          <input type="checkbox" name="social_work_interest[]" value={item.val} className="rounded border-input text-primary focus:ring-primary" />
                          <span className="font-medium text-xs">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">{t("volunteer.form.prevExp")}</Label>
                    <Textarea name="previous_experience" rows={2} placeholder={t("volunteer.form.prevExp")} />
                  </div>

                  <div>
                    <Label className="mb-2 block font-medium">{t("volunteer.form.memType")}</Label>
                    <select name="membership_type" className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus:ring-1 focus:ring-primary">
                      <option value="Volunteer">{t("volunteer.form.mem.volunteer")}</option>
                      <option value="General Member">{t("volunteer.form.mem.general")}</option>
                      <option value="Active Member">{t("volunteer.form.mem.active")}</option>
                      <option value="Life Member">{t("volunteer.form.mem.life")}</option>
                      <option value="Other">{t("volunteer.form.other")}</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION E: Verification Documents with Size Limit Badges */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h2 className="text-2xl font-semibold">{t("volunteer.form.docs")}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Attach identity documents (Max size: 5 MB per document • PDF, JPG, PNG)</p>
                  </div>
                  <span className="hidden sm:inline-block text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full">
                    Section E
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhaar Copy */}
                  <div className="p-4 rounded-lg border bg-card/30">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">{t("volunteer.form.aadhaarCopy")}</Label>
                      <span className="text-[10px] font-bold text-primary">Max 5 MB</span>
                    </div>
                    <Input
                      name="aadhaar_file"
                      type="file"
                      accept="image/jpeg,image/png,.pdf"
                      className="cursor-pointer file:cursor-pointer"
                      onChange={(e) => handleDocumentChange("aadhaar", e)}
                    />
                    {fileDetails.aadhaar ? (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {fileDetails.aadhaar.name} ({fileDetails.aadhaar.size})
                      </p>
                    ) : (
                      <span className="text-[11px] text-muted-foreground mt-1.5 block">Aadhaar Card front/back copy</span>
                    )}
                  </div>

                  {/* Address Proof */}
                  <div className="p-4 rounded-lg border bg-card/30">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">{t("volunteer.form.addrProof")}</Label>
                      <span className="text-[10px] font-bold text-primary">Max 5 MB</span>
                    </div>
                    <Input
                      name="address_proof_file"
                      type="file"
                      accept="image/jpeg,image/png,.pdf"
                      className="cursor-pointer file:cursor-pointer"
                      onChange={(e) => handleDocumentChange("address", e)}
                    />
                    {fileDetails.address ? (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {fileDetails.address.name} ({fileDetails.address.size})
                      </p>
                    ) : (
                      <span className="text-[11px] text-muted-foreground mt-1.5 block">Voter ID, Utility Bill, or Ration Card</span>
                    )}
                  </div>

                  {/* Other Document */}
                  <div className="p-4 rounded-lg border bg-card/30 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-medium">{t("volunteer.form.otherDoc")}</Label>
                      <span className="text-[10px] font-bold text-primary">Max 5 MB</span>
                    </div>
                    <Input
                      name="other_doc_file"
                      type="file"
                      accept="image/jpeg,image/png,.pdf"
                      className="cursor-pointer file:cursor-pointer"
                      onChange={(e) => handleDocumentChange("other", e)}
                    />
                    {fileDetails.other ? (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {fileDetails.other.name} ({fileDetails.other.size})
                      </p>
                    ) : (
                      <span className="text-[11px] text-muted-foreground mt-1.5 block">Optional certificates or supporting social work documents</span>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION F: Declaration */}
              <div className="space-y-4 bg-muted/40 p-6 rounded-xl border">
                <h2 className="text-base font-semibold">{t("volunteer.form.declaration")}</h2>
                <label className="flex items-start space-x-3 text-sm cursor-pointer">
                  <input type="checkbox" required className="mt-1 rounded border-input text-primary focus:ring-primary" />
                  <span className="leading-relaxed text-muted-foreground text-xs sm:text-sm">{t("volunteer.form.declarationText")}</span>
                </label>
              </div>

              {/* SECTION G: Form Actions & Bottom Options */}
              <div className="pt-2 space-y-4">
                <Button type="submit" size="lg" className="w-full text-base sm:text-lg h-12 gap-2 shadow" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {t("volunteer.submitting")}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      {t("volunteer.submit")}
                    </>
                  )}
                </Button>

                {/* Option for PDF at the End of the Page */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-primary" />
                    <span>Want to fill out offline or keep a hard copy?</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadBlankPdf}
                    className="gap-2 text-xs h-9 w-full sm:w-auto"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Download Blank Application Form (PDF)
                  </Button>
                </div>
              </div>

            </form>

            {/* Persistent Post-Submission Summary & PDF Download Section */}
            <AnimatePresence>
              {submittedData && (
                <motion.div
                  id="submission-summary"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-10 p-6 sm:p-8 rounded-xl border-2 border-primary/40 bg-primary/5 space-y-5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-primary/20 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground">Application Submitted Successfully!</h3>
                        <p className="text-xs text-muted-foreground">
                          Registration ID: <span className="font-mono font-bold text-primary">{submittedData.applicationNo}</span>
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400">
                      Application Verified & Saved
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Thank you, <strong className="text-foreground">{submittedData.full_name || submittedData.fullName}</strong>. Your volunteer application has been submitted to Hope Foundation. A PDF document with your passport photo, registration details, and attached documents has been compiled for your records.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button
                      size="lg"
                      onClick={() => generateVolunteerPdf(submittedData)}
                      className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex-1 h-12"
                    >
                      <FileDown className="w-5 h-5" />
                      Download Application Form (PDF)
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => window.print()}
                      className="gap-2 h-12"
                    >
                      <Printer className="w-4 h-4" />
                      Print Form
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={handleResetForm}
                      className="gap-2 h-12 text-muted-foreground"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Submit Another Application
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      </section>
    </div>
  );
}
