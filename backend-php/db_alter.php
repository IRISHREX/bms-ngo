<?php
require 'src/Config/Database.php';
use App\Config\Database;
$db = (new Database())->getConnection();
$db->exec('DROP TABLE IF EXISTS volunteers');
$db->exec("CREATE TABLE volunteers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    application_no VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    mother_name VARCHAR(255),
    dob DATE,
    gender ENUM('male', 'female', 'other'),
    age INT,
    marital_status ENUM('married', 'unmarried', 'other'),
    mobile_no VARCHAR(20) NOT NULL,
    whatsapp_no VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    village VARCHAR(255),
    post_office VARCHAR(255),
    police_station VARCHAR(255),
    district VARCHAR(255),
    pin_code VARCHAR(20),
    education VARCHAR(255),
    occupation VARCHAR(255),
    aadhaar_no VARCHAR(50),
    pan_no VARCHAR(50),
    join_reason TEXT,
    social_work_interest JSON,
    previous_experience TEXT,
    membership_type VARCHAR(100),
    photo_path VARCHAR(500),
    aadhaar_path VARCHAR(500),
    address_proof_path VARCHAR(500),
    other_doc_path VARCHAR(500),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)");
echo "Table volunteers recreated with new schema.";
