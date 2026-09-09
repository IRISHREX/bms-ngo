import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { type Volunteer } from "./api";
import { formatDate } from "./api";

// Using a placeholder base64 logo (a small 1x1 pixel image) or we can draw text instead.
// For robust generation without external network calls, drawing text for the logo is safest
// if we don't have a reliable base64 image string. We'll simulate a logo block.

export const generateVolunteerPdf = (v: Partial<Volunteer> | Record<string, any>) => {
  const doc = new jsPDF();
  
  // PAGE SETUP
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // === HEADER ===
  // Draw Logo placeholder / text
  doc.setFillColor(255, 204, 0); // Yellow/Orange theme color
  doc.rect(14, 15, 15, 15, "F");
  
  // Heart shape in logo placeholder
  doc.setFillColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("HF", 15.5, 25.5);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(22);
  doc.text("HOPE FOUNDATION", 35, 23);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Empowering Rural Communities", 35, 29);
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, pageWidth - 14, 35);
  
  // === TITLE ===
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Volunteer Application Details", pageWidth / 2, 45, { align: "center" });
  
  // === REGISTRATION ID ===
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const regId = v.applicationNo || v.id || `REG-${Math.floor(1000 + Math.random() * 9000)}`;
  doc.text(`Registration ID: ${regId}`, 14, 55);
  
  const dateStr = v.createdAt ? formatDate(v.createdAt) : new Date().toLocaleDateString();
  doc.text(`Date: ${dateStr}`, pageWidth - 14, 55, { align: "right" });

  // === DATA TABLE ===
  // Prepare data rows
  const tableData = [
    [{ content: "Personal Information", colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }],
    ["Full Name", v.fullName || v.full_name || "N/A"],
    ["Father's Name", v.fatherName || v.father_name || "N/A"],
    ["Mother's Name", v.motherName || v.mother_name || "N/A"],
    ["Date of Birth", v.dob || "N/A"],
    ["Gender", v.gender || "N/A"],
    ["Age", v.age?.toString() || "N/A"],
    ["Marital Status", v.maritalStatus || v.marital_status || "N/A"],
    
    [{ content: "Contact & Address", colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }],
    ["Mobile Number", v.mobileNo || v.mobile_no || "N/A"],
    ["WhatsApp Number", v.whatsappNo || v.whatsapp_no || "N/A"],
    ["Email Address", v.email || "N/A"],
    ["Address", v.address || "N/A"],
    ["Village", v.village || "N/A"],
    ["Post Office", v.postOffice || v.post_office || "N/A"],
    ["Police Station", v.policeStation || v.police_station || "N/A"],
    ["District", v.district || "N/A"],
    ["PIN Code", v.pinCode || v.pin_code || "N/A"],
    
    [{ content: "Education & Occupation", colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }],
    ["Highest Education", v.education || "N/A"],
    ["Occupation", v.occupation || "N/A"],
    ["Aadhaar Number", v.aadhaarNo || v.aadhaar_no || "N/A"],
    ["PAN Number", v.panNo || v.pan_no || "N/A"],
    
    [{ content: "Membership Details", colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 240] } }],
    ["Reason to Join", v.joinReason || v.join_reason || "N/A"],
    ["Social Work Interest", Array.isArray(v.socialWorkInterest || v.social_work_interest) ? (v.socialWorkInterest || v.social_work_interest).join(", ") : (v.socialWorkInterest || v.social_work_interest || "N/A")],
    ["Previous Experience", v.previousExperience || v.previous_experience || "N/A"],
    ["Membership Type", v.membershipType || v.membership_type || "N/A"],
    ["Status", v.status || "new"]
  ];

  autoTable(doc, {
    startY: 60,
    head: [],
    body: tableData,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: "auto" }
    },
    margin: { left: 14, right: 14 }
  });

  // === FOOTER ===
  const footerY = pageHeight - 20;
  doc.setDrawColor(200, 200, 200);
  doc.line(14, footerY - 5, pageWidth - 14, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Hope Foundation Trust • Near New Farakka Railway Station P.O-Farakka, Dist-Murshidabad West", pageWidth / 2, footerY, { align: "center" });
  doc.text("Official Email: sbi.18784@sbi.co.in | Thank you for volunteering with us.", pageWidth / 2, footerY + 5, { align: "center" });

  const fileName = `volunteer_${(v.fullName || v.full_name || v.id || "details").replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};
