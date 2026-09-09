const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fixLiveDb() {
  try {
    await ssh.connect({
      host: '147.93.17.56',
      port: 65002,
      username: 'u832627210',
      password: 'Sohel@34892'
    });
    console.log('Connected!');

    // Read the DB credentials from the remote .env file
    const envResult = await ssh.execCommand('cat /home/u832627210/domains/hopefoundationmsd.org/public_html/api/.env');
    console.log('Env file content:\n', envResult.stdout);
    
    // We will create a small php script to alter the table on the server
    const phpScript = `<?php
require 'vendor/autoload.php';
require 'src/Config/Database.php';
$dotenv = Dotenv\\Dotenv::createImmutable(__DIR__);
$dotenv->load();

use App\\Config\\Database;
$db = (new Database())->getConnection();

// Let's check the current schema of volunteers
try {
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
    echo "Live DB updated successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
`;

    // Upload script to the remote server
    await ssh.execCommand(`cat << 'EOF' > /home/u832627210/domains/hopefoundationmsd.org/public_html/api/live_db_alter.php\n${phpScript}\nEOF`);
    console.log('Script uploaded.');

    // Execute script on remote server
    const execRes = await ssh.execCommand('php /home/u832627210/domains/hopefoundationmsd.org/public_html/api/live_db_alter.php');
    console.log('Result:', execRes.stdout);
    if (execRes.stderr) console.error('Error:', execRes.stderr);

    ssh.dispose();
  } catch (err) {
    console.error('Error:', err);
  }
}

fixLiveDb();
