import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { type Volunteer } from "./api";
import { formatDate } from "./api";

/**
 * Loads an image from a Data URL, File, Blob, or URL and converts it to a standard JPEG Data URL
 * via an off-screen canvas. This is 100% reliable with jsPDF and avoids format / corruption issues.
 */
function loadImageToJpegDataUrl(source: any): Promise<string | null> {
  return new Promise((resolve) => {
    if (!source || typeof window === "undefined") {
      return resolve(null);
    }

    // If already a Data URL
    if (typeof source === "string" && source.startsWith("data:image")) {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 300;
          canvas.height = img.naturalHeight || 400;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.92));
          } else {
            resolve(source);
          }
        } catch {
          resolve(source);
        }
      };
      img.onerror = () => resolve(null);
      img.src = source;
      return;
    }

    // If File or Blob
    if (source instanceof File || source instanceof Blob) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        loadImageToJpegDataUrl(dataUrl).then(resolve);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(source);
      return;
    }

    // If string URL (remote or local)
    if (typeof source === "string") {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || 300;
          canvas.height = img.naturalHeight || 400;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL("image/jpeg", 0.92));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = source;
      return;
    }

    resolve(null);
  });
}

export const generateVolunteerPdf = async (v: Partial<Volunteer> | Record<string, any>) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // === HEADER LOGO & BRANDING ===
  doc.setFillColor(255, 204, 0); // Hope Foundation Yellow/Orange
  doc.rect(14, 12, 14, 14, "F");
  
  doc.setFillColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("HF", 15.5, 21.5);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(18);
  doc.text("HOPE FOUNDATION", 32, 19);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(110, 110, 110);
  doc.text("Empowering Rural Communities • Regd. Under Indian Trust Act • Murshidabad, WB", 32, 24);
  
  // Top horizontal separator line
  doc.setLineWidth(0.4);
  doc.setDrawColor(210, 210, 210);
  doc.line(14, 28, pageWidth - 55, 28);

  // === TITLE & APPLICATION METADATA ===
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("VOLUNTEER REGISTRATION RECORD", 14, 35);
  
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  const regId = v.applicationNo || v.application_no || v.id || `APP-${Math.floor(100000 + Math.random() * 900000)}`;
  doc.text(`Application No: ${regId}`, 14, 41);
  
  const dateStr = v.createdAt ? formatDate(v.createdAt) : new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  doc.text(`Registration Date: ${dateStr}`, 14, 46);
  
  const statusStr = (v.status || "Submitted").toUpperCase();
  doc.text(`Application Status: ${statusStr}`, 14, 51);

  // === TOP-RIGHT PASSPORT PHOTO SECTION ===
  const photoX = pageWidth - 46; // 164 mm
  const photoY = 12;
  const photoW = 32;
  const photoH = 40;

  const photoSource = v.photoDataUrl || v.photoPreview || v.photo_file || v.photoPath || v.photo_path;
  let photoData: string | null = null;
  if (photoSource) {
    photoData = await loadImageToJpegDataUrl(photoSource);
  }

  if (photoData) {
    try {
      doc.addImage(photoData, "JPEG", photoX, photoY, photoW, photoH);
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.35);
      doc.rect(photoX, photoY, photoW, photoH);
      doc.setFontSize(6.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(80, 80, 80);
      doc.text("PASSPORT PHOTO", photoX + photoW / 2, photoY + photoH + 3.5, { align: "center" });
    } catch {
      drawPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
    }
  } else {
    drawPhotoPlaceholder(doc, photoX, photoY, photoW, photoH);
  }

  // === PARSE SOCIAL WORK INTEREST ===
  let swi = v.socialWorkInterest || v.social_work_interest;
  if (typeof swi === "string" && (swi.startsWith("[") || swi.startsWith("{"))) {
    try {
      swi = JSON.parse(swi);
    } catch {
      // keep raw string
    }
  }
  const swiText = Array.isArray(swi) ? swi.join(", ") : (swi || "None specified");

  // Construct readable address
  const addressParts = [
    v.address,
    v.village ? `Vill: ${v.village}` : null,
    v.postOffice || v.post_office ? `P.O: ${v.postOffice || v.post_office}` : null,
    v.policeStation || v.police_station ? `P.S: ${v.policeStation || v.police_station}` : null,
    v.district ? `Dist: ${v.district}` : null,
    v.pinCode || v.pin_code ? `PIN: ${v.pinCode || v.pin_code}` : null
  ].filter(Boolean);
  const fullAddressDisplay = addressParts.length > 0 ? addressParts.join(", ") : "N/A";

  // === DATA TABLE (COMPACT 1-PAGE LAYOUT) ===
  const tableData = [
    [{ content: "A. Personal & Identification", colSpan: 2, styles: { fontStyle: "bold", fillColor: [242, 244, 247], textColor: [20, 20, 20], cellPadding: 2 } }],
    ["Full Name", v.fullName || v.full_name || "N/A"],
    ["Father's Name", v.fatherName || v.father_name || "N/A"],
    ["Mother's Name", v.motherName || v.mother_name || "N/A"],
    ["Date of Birth / Age", `${v.dob || "N/A"} (${v.age ? v.age + " yrs" : "N/A"})`],
    ["Gender / Marital Status", `${(v.gender ? String(v.gender).toUpperCase() : "N/A")} • ${(v.maritalStatus || v.marital_status || "N/A")}`],
    ["Aadhaar / PAN Number", `Aadhaar: ${v.aadhaarNo || v.aadhaar_no || "N/A"} | PAN: ${v.panNo || v.pan_no || "N/A"}`],
    ["Highest Education", v.education || "N/A"],
    ["Occupation", v.occupation || "N/A"],
    
    [{ content: "B. Contact & Communication Details", colSpan: 2, styles: { fontStyle: "bold", fillColor: [242, 244, 247], textColor: [20, 20, 20], cellPadding: 2 } }],
    ["Mobile & WhatsApp", `Mobile: ${v.mobileNo || v.mobile_no || "N/A"} | WhatsApp: ${v.whatsappNo || v.whatsapp_no || "N/A"}`],
    ["Email Address", v.email || "N/A"],
    ["Residential Address", fullAddressDisplay],
    
    [{ content: "C. Membership & Community Interests", colSpan: 2, styles: { fontStyle: "bold", fillColor: [242, 244, 247], textColor: [20, 20, 20], cellPadding: 2 } }],
    ["Membership Type", v.membershipType || v.membership_type || "General Volunteer"],
    ["Reason for Joining", v.joinReason || v.join_reason || "Community welfare and rural service"],
    ["Areas of Interest", swiText],
    ["Previous Experience", v.previousExperience || v.previous_experience || "None mentioned"],

    [{ content: "D. Attached Verification Documents", colSpan: 2, styles: { fontStyle: "bold", fillColor: [242, 244, 247], textColor: [20, 20, 20], cellPadding: 2 } }],
    ["Passport Photo", (v.photoPath || v.photo_path || v.photoDataUrl || v.photo_file) ? "[Uploaded & Embedded in Form]" : "Not Provided"],
    ["Aadhaar Card Copy", (v.aadhaarPath || v.aadhaar_path || v.aadhaar_file) ? "[Attached Document]" : "Not Provided"],
    ["Address Proof Copy", (v.addressProofPath || v.address_proof_path || v.address_proof_file) ? "[Attached Document]" : "Not Provided"],
    ["Other Documents", (v.otherDocPath || v.other_doc_path || v.other_doc_file) ? "[Attached Document]" : "Not Provided"]
  ];

  autoTable(doc, {
    startY: 57,
    head: [],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [40, 40, 40],
      lineColor: [220, 220, 220],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, textColor: [30, 30, 30] },
      1: { cellWidth: "auto" }
    },
    margin: { left: 14, right: 14 }
  });

  // === FOOTER & VERIFICATION STAMP ===
  const footerY = pageHeight - 14;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.35);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);
  doc.setFontSize(7.5);
  doc.setTextColor(110, 110, 110);
  doc.text("Hope Foundation Trust • Near New Farakka Railway Station, P.O-Farakka, Dist-Murshidabad, West Bengal", pageWidth / 2, footerY, { align: "center" });
  doc.text("Official Email: sbi.18784@sbi.co.in | Verified NGO Volunteer Application Form", pageWidth / 2, footerY + 3.8, { align: "center" });

  const safeName = (v.fullName || v.full_name || v.id || "applicant").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `volunteer_${safeName}.pdf`;
  doc.save(fileName);
};

function drawPhotoPlaceholder(doc: jsPDF, x: number, y: number, w: number, h: number) {
  doc.setDrawColor(170, 170, 170);
  doc.setLineWidth(0.3);
  doc.rect(x, y, w, h);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(140, 140, 140);
  doc.text("Affix Passport", x + w / 2, y + h / 2 - 2, { align: "center" });
  doc.text("Photo Here", x + w / 2, y + h / 2 + 2.5, { align: "center" });
  doc.text("(3.5 x 4.5 cm)", x + w / 2, y + h / 2 + 7, { align: "center" });
}
