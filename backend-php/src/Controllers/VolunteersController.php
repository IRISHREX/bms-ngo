<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;

class VolunteersController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getAll(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM volunteers ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            $volunteers = array_map([$this, 'mapVolunteer'], $rows);

            $response->getBody()->write(json_encode($volunteers));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function create(Request $request, Response $response, $args) {
        $body = $request->getParsedBody();
        $uploadedFiles = $request->getUploadedFiles();

        $fullName = $body['full_name'] ?? null;
        if (!$fullName) {
            $response->getBody()->write(json_encode(["error" => "Full Name is required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Handle file uploads
        $baseUploadDir = $_ENV['UPLOAD_DIR'] ?? (__DIR__ . '/../../public/uploads');
        if (!is_dir($baseUploadDir)) {
            @mkdir($baseUploadDir, 0777, true);
        }
        $volunteersUploadDir = rtrim($baseUploadDir, '/\\') . DIRECTORY_SEPARATOR . 'volunteers';
        if (!is_dir($volunteersUploadDir)) {
            @mkdir($volunteersUploadDir, 0777, true);
        }

        $photoPath = $this->handleFileUpload($uploadedFiles['photo_file'] ?? null, $volunteersUploadDir, 'volunteers');
        $aadhaarPath = $this->handleFileUpload($uploadedFiles['aadhaar_file'] ?? null, $volunteersUploadDir, 'volunteers');
        $addressProofPath = $this->handleFileUpload($uploadedFiles['address_proof_file'] ?? null, $volunteersUploadDir, 'volunteers');
        $otherDocPath = $this->handleFileUpload($uploadedFiles['other_doc_file'] ?? null, $volunteersUploadDir, 'volunteers');

        try {
            $stmt = $this->db->prepare("INSERT INTO volunteers (
                application_no, full_name, father_name, mother_name, dob, gender, age, 
                marital_status, mobile_no, whatsapp_no, email, address, village, 
                post_office, police_station, district, pin_code, education, occupation, 
                aadhaar_no, pan_no, join_reason, social_work_interest, previous_experience, 
                membership_type, photo_path, aadhaar_path, address_proof_path, other_doc_path
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            
            $applicationNo = 'APP-' . strtoupper(uniqid());

            $age = $body['age'] ?? null;
            if ($age === '') $age = null;

            $dob = $body['dob'] ?? null;
            if ($dob === '') $dob = null;

            $swi = $body['social_work_interest'] ?? null;
            if (empty($swi)) {
                $swi = null;
            } else {
                if (!is_array($swi)) {
                    $swi = [$swi];
                }
                $swi = json_encode($swi);
            }

            $stmt->execute([
                $applicationNo,
                $fullName,
                $body['father_name'] ?? null,
                $body['mother_name'] ?? null,
                $dob,
                $body['gender'] ?? null,
                $age,
                $body['marital_status'] ?? null,
                $body['mobile_no'] ?? null,
                $body['whatsapp_no'] ?? null,
                $body['email'] ?? null,
                $body['address'] ?? null,
                $body['village'] ?? null,
                $body['post_office'] ?? null,
                $body['police_station'] ?? null,
                $body['district'] ?? null,
                $body['pin_code'] ?? null,
                $body['education'] ?? null,
                $body['occupation'] ?? null,
                $body['aadhaar_no'] ?? null,
                $body['pan_no'] ?? null,
                $body['join_reason'] ?? null,
                $swi,
                $body['previous_experience'] ?? null,
                $body['membership_type'] ?? null,
                $photoPath,
                $aadhaarPath,
                $addressProofPath,
                $otherDocPath
            ]);
            
            $insertId = $this->db->lastInsertId();

            $response->getBody()->write(json_encode(["id" => (string)$insertId, "application_no" => $applicationNo, "message" => "Application submitted successfully."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function handleFileUpload($uploadedFile, $uploadDir, $folderName = 'volunteers') {
        if ($uploadedFile && $uploadedFile->getError() === UPLOAD_ERR_OK) {
            $ext = pathinfo($uploadedFile->getClientFilename(), PATHINFO_EXTENSION);
            $filename = uniqid() . '-' . time() . '.' . $ext;
            $targetPath = rtrim($uploadDir, '/\\') . DIRECTORY_SEPARATOR . $filename;
            $uploadedFile->moveTo($targetPath);
            return 'uploads/' . $folderName . '/' . $filename;
        }
        return null;
    }

    public function update(Request $request, Response $response, $args) {
        $id = $args['id'];
        $body = json_decode($request->getBody(), true);
        $status = $body['status'] ?? null;
        
        if (!$status) {
            $response->getBody()->write(json_encode(["error" => "Status is required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("UPDATE volunteers SET status = ? WHERE id = ?");
            $stmt->execute([$status, $id]);
            
            $response->getBody()->write(json_encode(["message" => "Volunteer updated"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function export(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM volunteers ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            
            $csv = "Name,Phone,Email,Type,Status,Date\n";
            foreach ($rows as $r) {
                // Escape quotes for CSV
                $appNo = str_replace('"', '""', $r['application_no'] ?? '');
                $name = str_replace('"', '""', $r['full_name']);
                $phone = str_replace('"', '""', $r['mobile_no']);
                $email = str_replace('"', '""', $r['email']);
                $type = str_replace('"', '""', $r['membership_type'] ?? '');
                $status = str_replace('"', '""', $r['status']);
                $date = str_replace('"', '""', $r['created_at']);
                
                $csv .= "\"$appNo\",\"$name\",\"$phone\",\"$email\",\"$type\",\"$status\",\"$date\"\n";
            }

            $response->getBody()->write($csv);
            return $response
                ->withHeader('Content-Type', 'text/csv')
                ->withHeader('Content-Disposition', 'attachment; filename="volunteers.csv"')
                ->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function downloadDocument(Request $request, Response $response, $args) {
        $id = $args['id'];
        $type = $args['type']; // 'photo', 'aadhaar', 'address_proof', 'other_doc'

        $columnMap = [
            'photo' => 'photo_path',
            'aadhaar' => 'aadhaar_path',
            'address_proof' => 'address_proof_path',
            'other_doc' => 'other_doc_path'
        ];

        if (!isset($columnMap[$type])) {
            $response->getBody()->write(json_encode(["error" => "Invalid document type"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $col = $columnMap[$type];
        try {
            $stmt = $this->db->prepare("SELECT id, full_name, {$col} as doc_path FROM volunteers WHERE id = ?");
            $stmt->execute([$id]);
            $row = $stmt->fetch();

            if (!$row || empty($row['doc_path'])) {
                $response->getBody()->write(json_encode(["error" => "Document not found"]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $filePath = $this->resolveVolunteerFilePath($row['doc_path']);
            if (!$filePath || !file_exists($filePath)) {
                $response->getBody()->write(json_encode(["error" => "File not found on disk"]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $mime = function_exists('mime_content_type') ? @mime_content_type($filePath) : null;
            if (!$mime) {
                $mime = 'application/octet-stream';
            }

            $ext = pathinfo($filePath, PATHINFO_EXTENSION);
            $safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', $row['full_name']);
            $downloadFilename = "volunteer_{$safeName}_{$type}.{$ext}";

            $stream = new \Slim\Psr7\Stream(fopen($filePath, 'rb'));
            return $response
                ->withBody($stream)
                ->withHeader('Content-Type', $mime)
                ->withHeader('Content-Disposition', 'attachment; filename="' . $downloadFilename . '"')
                ->withHeader('Content-Length', (string)filesize($filePath));
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function resolveVolunteerFilePath($storedPath) {
        if (!empty($storedPath) && file_exists($storedPath)) return $storedPath;

        $basename = basename($storedPath);
        $baseUploadDir = $_ENV['UPLOAD_DIR'] ?? (__DIR__ . '/../../public/uploads');

        $candidates = [
            rtrim($baseUploadDir, '/\\') . DIRECTORY_SEPARATOR . 'volunteers' . DIRECTORY_SEPARATOR . $basename,
            rtrim($baseUploadDir, '/\\') . DIRECTORY_SEPARATOR . $basename,
            __DIR__ . '/../../public/uploads/volunteers/' . $basename,
            __DIR__ . '/../../public/uploads/' . $basename,
            __DIR__ . '/../../uploads/volunteers/' . $basename,
            __DIR__ . '/../../uploads/' . $basename,
            dirname(__DIR__, 2) . '/public/uploads/volunteers/' . $basename,
            dirname(__DIR__, 2) . '/public/uploads/' . $basename,
        ];

        foreach ($candidates as $cand) {
            if (file_exists($cand)) return $cand;
        }

        return null;
    }

    private function getUploadUrl() {
        return rtrim($_ENV['UPLOAD_URL'] ?? 'http://localhost:5000/uploads', '/');
    }

    private function formatFileUrl($path, $volunteerId = null, $type = null) {
        if (empty($path)) return null;
        if (preg_match('/^https?:\/\//i', $path)) return $path;

        $clean = ltrim(str_replace('\\', '/', $path), '/');
        $uploadUrl = $this->getUploadUrl();

        // If path begins with uploads/, remove it so we don't end up with /uploads/uploads/
        if (str_starts_with($clean, 'uploads/')) {
            $clean = substr($clean, strlen('uploads/'));
        }

        return $uploadUrl . '/' . ltrim($clean, '/');
    }

    private function mapVolunteer($row) {
        return [
            'id' => (string)$row['id'],
            'applicationNo' => $row['application_no'],
            'fullName' => $row['full_name'],
            'fatherName' => $row['father_name'],
            'motherName' => $row['mother_name'],
            'dob' => $row['dob'],
            'gender' => $row['gender'],
            'age' => $row['age'],
            'maritalStatus' => $row['marital_status'],
            'mobileNo' => $row['mobile_no'],
            'whatsappNo' => $row['whatsapp_no'],
            'email' => $row['email'],
            'address' => $row['address'],
            'village' => $row['village'],
            'postOffice' => $row['post_office'],
            'policeStation' => $row['police_station'],
            'district' => $row['district'],
            'pinCode' => $row['pin_code'],
            'education' => $row['education'],
            'occupation' => $row['occupation'],
            'aadhaarNo' => $row['aadhaar_no'],
            'panNo' => $row['pan_no'],
            'joinReason' => $row['join_reason'],
            'socialWorkInterest' => $row['social_work_interest'],
            'previousExperience' => $row['previous_experience'],
            'membershipType' => $row['membership_type'],
            'photoPath' => $this->formatFileUrl($row['photo_path']),
            'aadhaarPath' => $this->formatFileUrl($row['aadhaar_path']),
            'addressProofPath' => $this->formatFileUrl($row['address_proof_path']),
            'otherDocPath' => $this->formatFileUrl($row['other_doc_path']),
            'photoDownloadUrl' => $row['photo_path'] ? ('/api/volunteers/' . $row['id'] . '/document/photo') : null,
            'aadhaarDownloadUrl' => $row['aadhaar_path'] ? ('/api/volunteers/' . $row['id'] . '/document/aadhaar') : null,
            'addressProofDownloadUrl' => $row['address_proof_path'] ? ('/api/volunteers/' . $row['id'] . '/document/address_proof') : null,
            'otherDocDownloadUrl' => $row['other_doc_path'] ? ('/api/volunteers/' . $row['id'] . '/document/other_doc') : null,
            'status' => $row['status'],
            'createdAt' => $row['created_at'],
        ];
    }
}
