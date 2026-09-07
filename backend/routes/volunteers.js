const router = require("express").Router();
const db = require("../config/db");
const { verifyToken } = require("../middleware/auth");

// GET /api/volunteers (admin)
router.get("/", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM volunteers ORDER BY created_at DESC");
    res.json(rows.map(mapVolunteer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const { upload } = require("../middleware/upload");
const { v4: uuidv4 } = require("uuid");

// POST /api/volunteers (public form)
router.post("/", upload.fields([
  { name: 'photo_file', maxCount: 1 },
  { name: 'aadhaar_file', maxCount: 1 },
  { name: 'address_proof_file', maxCount: 1 },
  { name: 'other_doc_file', maxCount: 1 }
]), async (req, res) => {
  try {
    const b = req.body;
    if (!b.full_name) {
      return res.status(400).json({ error: "Full Name is required" });
    }

    const getPath = (fieldname) => {
      if (req.files && req.files[fieldname] && req.files[fieldname].length > 0) {
        return `uploads/${req.files[fieldname][0].filename}`;
      }
      return null;
    };

    const applicationNo = 'APP-' + uuidv4().slice(0, 8).toUpperCase();
    
    const [result] = await db.query(
      `INSERT INTO volunteers (
        application_no, full_name, father_name, mother_name, dob, gender, age, 
        marital_status, mobile_no, whatsapp_no, email, address, village, 
        post_office, police_station, district, pin_code, education, occupation, 
        aadhaar_no, pan_no, join_reason, social_work_interest, previous_experience, 
        membership_type, photo_path, aadhaar_path, address_proof_path, other_doc_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicationNo, b.full_name, b.father_name || null, b.mother_name || null, b.dob || null,
        b.gender || null, b.age || null, b.marital_status || null, b.mobile_no || null,
        b.whatsapp_no || null, b.email || null, b.address || null, b.village || null,
        b.post_office || null, b.police_station || null, b.district || null, b.pin_code || null,
        b.education || null, b.occupation || null, b.aadhaar_no || null, b.pan_no || null,
        b.join_reason || null, b.social_work_interest || null, b.previous_experience || null,
        b.membership_type || null, getPath('photo_file'), getPath('aadhaar_file'), 
        getPath('address_proof_file'), getPath('other_doc_file')
      ]
    );
    res.status(201).json({ id: String(result.insertId), application_no: applicationNo, message: "Application submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/volunteers/:id (admin update status)
router.put("/:id", verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    await db.query("UPDATE volunteers SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ message: "Volunteer updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/volunteers/export (CSV)
router.get("/export", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM volunteers ORDER BY created_at DESC");
    const csv = ["Name,Phone,Email,Type,Status,Date"]
      .concat(rows.map((r) => `"${r.application_no || ''}","${r.full_name}","${r.mobile_no}","${r.email}","${r.membership_type || ''}","${r.status}","${r.created_at}"`))
      .join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=volunteers.csv");
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function mapVolunteer(row) {
  return {
    id: String(row.id),
    applicationNo: row.application_no,
    fullName: row.full_name,
    fatherName: row.father_name,
    motherName: row.mother_name,
    dob: row.dob,
    gender: row.gender,
    age: row.age,
    maritalStatus: row.marital_status,
    mobileNo: row.mobile_no,
    whatsappNo: row.whatsapp_no,
    email: row.email,
    address: row.address,
    village: row.village,
    postOffice: row.post_office,
    policeStation: row.police_station,
    district: row.district,
    pinCode: row.pin_code,
    education: row.education,
    occupation: row.occupation,
    aadhaarNo: row.aadhaar_no,
    panNo: row.pan_no,
    joinReason: row.join_reason,
    socialWorkInterest: row.social_work_interest,
    previousExperience: row.previous_experience,
    membershipType: row.membership_type,
    photoPath: row.photo_path,
    aadhaarPath: row.aadhaar_path,
    addressProofPath: row.address_proof_path,
    otherDocPath: row.other_doc_path,
    status: row.status,
    createdAt: row.created_at,
  };
}

module.exports = router;
