<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;
use Slim\Psr7\UploadedFile;

class FilesController {
    private $db;
    private $uploadDir;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        // Fallback to local if not set
        $this->uploadDir = $_ENV['UPLOAD_DIR'] ?? __DIR__ . '/../../public/uploads';
        
        if (!is_dir($this->uploadDir)) {
            @mkdir($this->uploadDir, 0777, true);
        }
    }

    private function getUploadUrl() {
        return $_ENV['UPLOAD_URL'] ?? 'http://localhost:5000/uploads';
    }

    public function getAll(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM files ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            
            $files = [];
            foreach ($rows as $f) {
                $filename = basename($f['file_path']);
                $files[] = [
                    'id' => (string)$f['id'],
                    'name' => $f['name'],
                    'type' => $f['type'],
                    'size' => $f['size'],
                    'folder' => $f['folder'],
                    'uploadedBy' => $f['uploaded_by'],
                    'uploadedAt' => $f['created_at'],
                    'usedIn' => $f['used_in'] ?? '',
                    'url' => $this->getUploadUrl() . '/' . $f['folder'] . '/' . $filename,
                    'downloadUrl' => '/api/files/' . $f['id'] . '/download'
                ];
            }

            $response->getBody()->write(json_encode($files));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function upload(Request $request, Response $response, $args) {
        $uploadedFiles = $request->getUploadedFiles();
        
        if (empty($uploadedFiles['file'])) {
            $response->getBody()->write(json_encode(["error" => "No file uploaded"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        /** @var UploadedFile $uploadedFile */
        $uploadedFile = $uploadedFiles['file'];
        
        if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
            $response->getBody()->write(json_encode(["error" => "File upload error code: " . $uploadedFile->getError()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $body = $request->getParsedBody();
        $folder = $body['folder'] ?? 'general';
        $usedIn = $body['usedIn'] ?? '';
        
        $targetFolder = $this->uploadDir . '/' . $folder;
        if (!is_dir($targetFolder)) {
            @mkdir($targetFolder, 0777, true);
        }

        $originalName = $uploadedFile->getClientFilename();
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        $type = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']) ? 'image' : $ext;
        
        // Generate unique filename
        $filename = uniqid() . '-' . time() . '.' . $ext;
        $targetPath = $targetFolder . DIRECTORY_SEPARATOR . $filename;

        try {
            $uploadedFile->moveTo($targetPath);

            $user = $request->getAttribute('user');
            $uploaderName = $user ? ($user->name ?? 'Unknown') : 'Unknown';

            $stmt = $this->db->prepare("INSERT INTO files (name, type, size, folder, uploaded_by, used_in, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$originalName, $type, $uploadedFile->getSize(), $folder, $uploaderName, $usedIn, $targetPath]);
            
            $insertId = $this->db->lastInsertId();

            $result = [
                "id" => (string)$insertId,
                "name" => $originalName,
                "type" => $type,
                "size" => $uploadedFile->getSize(),
                "folder" => $folder,
                "uploadedBy" => $uploaderName,
                "uploadedAt" => date('c'),
                "usedIn" => $usedIn,
                "url" => $this->getUploadUrl() . '/' . $folder . '/' . $filename
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, $args) {
        $id = $args['id'];
        
        try {
            $stmt = $this->db->prepare("SELECT * FROM files WHERE id = ?");
            $stmt->execute([$id]);
            $file = $stmt->fetch();

            if (!$file) {
                $response->getBody()->write(json_encode(["error" => "File not found"]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            if (file_exists($file['file_path'])) {
                unlink($file['file_path']);
            }

            $delStmt = $this->db->prepare("DELETE FROM files WHERE id = ?");
            $delStmt->execute([$id]);
            
            $response->getBody()->write(json_encode(["message" => "File deleted"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getById(Request $request, Response $response, $args) {
        $id = $args['id'];
        try {
            $stmt = $this->db->prepare("SELECT * FROM files WHERE id = ?");
            $stmt->execute([$id]);
            $f = $stmt->fetch();

            if (!$f) {
                $response->getBody()->write(json_encode(["error" => "File not found"]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $filename = basename($f['file_path']);
            $data = [
                'id' => (string)$f['id'],
                'name' => $f['name'],
                'type' => $f['type'],
                'size' => $f['size'],
                'folder' => $f['folder'],
                'uploadedBy' => $f['uploaded_by'],
                'uploadedAt' => $f['created_at'],
                'usedIn' => $f['used_in'] ?? '',
                'url' => $this->getUploadUrl() . '/' . $f['folder'] . '/' . $filename,
                'downloadUrl' => '/api/files/' . $f['id'] . '/download'
            ];

            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function download(Request $request, Response $response, $args) {
        $id = $args['id'];
        try {
            $stmt = $this->db->prepare("SELECT * FROM files WHERE id = ?");
            $stmt->execute([$id]);
            $file = $stmt->fetch();

            if (!$file) {
                $response->getBody()->write(json_encode(["error" => "File not found"]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $path = $this->resolveFilePath($file['file_path'], $file['folder']);
            if (!$path || !file_exists($path)) {
                $response->getBody()->write(json_encode(["error" => "File not found on disk"]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            }

            $mime = function_exists('mime_content_type') ? @mime_content_type($path) : null;
            if (!$mime) {
                $mime = 'application/octet-stream';
            }
            $downloadName = $file['name'] ?: basename($path);

            $stream = new \Slim\Psr7\Stream(fopen($path, 'rb'));
            return $response
                ->withBody($stream)
                ->withHeader('Content-Type', $mime)
                ->withHeader('Content-Disposition', 'attachment; filename="' . addslashes($downloadName) . '"')
                ->withHeader('Content-Length', (string)filesize($path));
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function resolveFilePath($storedPath, $folder = '') {
        if (!empty($storedPath) && file_exists($storedPath)) return $storedPath;

        $basename = basename($storedPath);
        $candidates = [
            $this->uploadDir . DIRECTORY_SEPARATOR . $folder . DIRECTORY_SEPARATOR . $basename,
            $this->uploadDir . DIRECTORY_SEPARATOR . $basename,
            __DIR__ . '/../../public/uploads/' . $folder . '/' . $basename,
            __DIR__ . '/../../public/uploads/' . $basename,
            __DIR__ . '/../../uploads/' . $folder . '/' . $basename,
            __DIR__ . '/../../uploads/' . $basename,
        ];

        foreach ($candidates as $candidate) {
            if (file_exists($candidate)) return $candidate;
        }

        return null;
    }
}
