<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;
use Slim\Psr7\UploadedFile;

class HeroSlidesController {
    private $db;
    private $uploadDir;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->uploadDir = !empty($_ENV['UPLOAD_DIR']) && is_dir($_ENV['UPLOAD_DIR'])
            ? $_ENV['UPLOAD_DIR']
            : (realpath(__DIR__ . '/../../public/uploads') ?: (__DIR__ . '/../../public/uploads'));
        
        if (!is_dir($this->uploadDir)) {
            @mkdir($this->uploadDir, 0777, true);
        }

        // Auto-create table if not exists
        try {
            $this->db->exec("CREATE TABLE IF NOT EXISTS hero_slides (
                id INT PRIMARY KEY AUTO_INCREMENT,
                image_url VARCHAR(500) NOT NULL,
                file_path VARCHAR(500) NULL,
                sort_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )");
        } catch (\Exception $e) {
            // Table may already exist or error ignored
        }
    }

    private function getUploadUrl() {
        return rtrim($_ENV['UPLOAD_URL'] ?? 'https://api.hopefoundationmsd.org/uploads', '/');
    }

    public function getAll(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM hero_slides ORDER BY sort_order ASC, created_at ASC");
            $rows = $stmt->fetchAll();

            $slides = [];
            foreach ($rows as $r) {
                $filename = basename($r['file_path'] ?? '');
                $url = !empty($r['image_url'])
                    ? $r['image_url']
                    : ($this->getUploadUrl() . '/hero/' . $filename);

                $slides[] = [
                    'id' => (string)$r['id'],
                    'imageUrl' => $url,
                    'sortOrder' => (int)($r['sort_order'] ?? 0),
                    'createdAt' => $r['created_at']
                ];
            }

            $response->getBody()->write(json_encode($slides));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function create(Request $request, Response $response, $args) {
        // Enforce maximum 5 slides
        $countStmt = $this->db->query("SELECT COUNT(*) as total FROM hero_slides");
        $countRow = $countStmt->fetch();
        $total = (int)($countRow['total'] ?? 0);

        if ($total >= 5) {
            $response->getBody()->write(json_encode(["error" => "Maximum 5 hero images allowed. Please delete an existing image before adding a new one."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $uploadedFiles = $request->getUploadedFiles();
        /** @var UploadedFile|null $uploadedFile */
        $uploadedFile = $uploadedFiles['slide'] ?? $uploadedFiles['file'] ?? $uploadedFiles['photo'] ?? null;

        if (!$uploadedFile || $uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode(["error" => "No image uploaded or upload error occurred."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Validate max 5MB size
        $maxBytes = 5 * 1024 * 1024;
        if ($uploadedFile->getSize() > $maxBytes) {
            $response->getBody()->write(json_encode(["error" => "File size exceeds 5 MB limit."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        // Validate extension
        $originalName = $uploadedFile->getClientFilename();
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!in_array($ext, $allowed)) {
            $response->getBody()->write(json_encode(["error" => "Only JPG, PNG, WEBP, and GIF images are allowed."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $targetFolder = $this->uploadDir . DIRECTORY_SEPARATOR . 'hero';
        if (!is_dir($targetFolder)) {
            @mkdir($targetFolder, 0777, true);
        }

        $filename = 'hero-' . uniqid() . '-' . time() . '.' . $ext;
        $targetPath = $targetFolder . DIRECTORY_SEPARATOR . $filename;

        try {
            $uploadedFile->moveTo($targetPath);

            $imageUrl = $this->getUploadUrl() . '/hero/' . $filename;
            $sortOrder = $total;

            $stmt = $this->db->prepare("INSERT INTO hero_slides (image_url, file_path, sort_order) VALUES (?, ?, ?)");
            $stmt->execute([$imageUrl, $targetPath, $sortOrder]);

            $id = $this->db->lastInsertId();

            $result = [
                'id' => (string)$id,
                'imageUrl' => $imageUrl,
                'sortOrder' => $sortOrder,
                'createdAt' => date('Y-m-d H:i:s')
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (\Exception $e) {
            if (file_exists($targetPath)) {
                @unlink($targetPath);
            }
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, $args) {
        $id = $args['id'] ?? null;
        if (!$id) {
            $response->getBody()->write(json_encode(["error" => "Slide ID required."]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM hero_slides WHERE id = ?");
            $stmt->execute([$id]);
            $slide = $stmt->fetch();

            if ($slide) {
                if (!empty($slide['file_path']) && file_exists($slide['file_path'])) {
                    @unlink($slide['file_path']);
                }
                $delStmt = $this->db->prepare("DELETE FROM hero_slides WHERE id = ?");
                $delStmt->execute([$id]);
            }

            $response->getBody()->write(json_encode(["message" => "Slide deleted", "success" => true]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
