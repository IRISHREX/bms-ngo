<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;
use Slim\Psr7\UploadedFile;

class GalleryController {
    private $db;
    private $uploadDir;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->uploadDir = $_ENV['UPLOAD_DIR'] ?? __DIR__ . '/../../public/uploads';
    }

    private function getUploadUrl() {
        return $_ENV['UPLOAD_URL'] ?? 'http://localhost:5000/uploads';
    }

    public function getAll(Request $request, Response $response, $args) {
        try {
            $sql = "SELECT g.id, g.caption, g.category, g.created_at, f.file_path, f.folder 
                    FROM gallery g 
                    LEFT JOIN files f ON g.file_id = f.id 
                    ORDER BY g.created_at DESC";
            
            $stmt = $this->db->query($sql);
            $rows = $stmt->fetchAll();
            
            $items = [];
            foreach ($rows as $r) {
                $_folder = !empty($r['file_path']) ? basename(dirname($r['file_path'])) : $r['folder'];
                $url = !empty($r['file_path']) ? $this->getUploadUrl() . '/' . ($_folder ?: 'gallery') . '/' . basename($r['file_path']) : "";
                
                $items[] = [
                    'id' => (string)$r['id'],
                    'url' => $url,
                    'caption' => $r['caption'] ?? '',
                    'category' => $r['category'],
                    'uploadedAt' => $r['created_at']
                ];
            }

            $response->getBody()->write(json_encode($items));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function create(Request $request, Response $response, $args) {
        $uploadedFiles = $request->getUploadedFiles();
        
        if (empty($uploadedFiles['photos']) || !is_array($uploadedFiles['photos'])) {
            $response->getBody()->write(json_encode(["error" => "No photos uploaded"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        $body = $request->getParsedBody();
        $category = $body['category'] ?? 'events';
        $caption = $body['caption'] ?? '';
        
        $targetFolder = $this->uploadDir . '/gallery';
        if (!is_dir($targetFolder)) {
            @mkdir($targetFolder, 0777, true);
        }

        $results = [];
        $user = $request->getAttribute('user');
        $uploaderName = $user ? ($user->name ?? 'Unknown') : 'Unknown';

        try {
            $this->db->beginTransaction();

            foreach ($uploadedFiles['photos'] as $uploadedFile) {
                if ($uploadedFile->getError() === UPLOAD_ERR_OK) {
                    $originalName = $uploadedFile->getClientFilename();
                    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
                    $type = in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp']) ? 'image' : $ext;
                    
                    $filename = uniqid() . '-' . time() . '.' . $ext;
                    $targetPath = $targetFolder . DIRECTORY_SEPARATOR . $filename;
                    
                    $uploadedFile->moveTo($targetPath);

                    $stmt = $this->db->prepare("INSERT INTO files (name, type, size, folder, uploaded_by, used_in, file_path) VALUES (?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$originalName, $type, $uploadedFile->getSize(), 'gallery', $uploaderName, 'Gallery', $targetPath]);
                    $fileId = $this->db->lastInsertId();

                    $galStmt = $this->db->prepare("INSERT INTO gallery (caption, category, file_id) VALUES (?, ?, ?)");
                    $galStmt->execute([$caption, $category, $fileId]);
                    $galleryId = $this->db->lastInsertId();

                    $results[] = [
                        "id" => (string)$galleryId,
                        "url" => $this->getUploadUrl() . '/gallery/' . $filename,
                        "caption" => $caption,
                        "category" => $category,
                        "uploadedAt" => date('c')
                    ];
                }
            }
            
            $this->db->commit();
            $response->getBody()->write(json_encode($results));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
            
        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function update(Request $request, Response $response, $args) {
        $id = $args['id'];
        $body = json_decode($request->getBody(), true);
        $caption = $body['caption'] ?? null;
        $category = $body['category'] ?? null;

        try {
            $stmt = $this->db->prepare("UPDATE gallery SET caption = ?, category = ? WHERE id = ?");
            $stmt->execute([$caption, $category, $id]);
            
            $response->getBody()->write(json_encode(["message" => "Updated"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, $args) {
        $id = $args['id'];
        
        try {
            $this->db->beginTransaction();

            $stmt = $this->db->prepare("SELECT file_id FROM gallery WHERE id = ?");
            $stmt->execute([$id]);
            $gallery = $stmt->fetch();

            $delStmt = $this->db->prepare("DELETE FROM gallery WHERE id = ?");
            $delStmt->execute([$id]);

            if ($gallery && $gallery['file_id']) {
                $fileStmt = $this->db->prepare("SELECT file_path FROM files WHERE id = ?");
                $fileStmt->execute([$gallery['file_id']]);
                $file = $fileStmt->fetch();

                if ($file && file_exists($file['file_path'])) {
                    unlink($file['file_path']);
                }

                $delFileStmt = $this->db->prepare("DELETE FROM files WHERE id = ?");
                $delFileStmt->execute([$gallery['file_id']]);
            }

            $this->db->commit();
            $response->getBody()->write(json_encode(["message" => "Deleted"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (\Exception $e) {
            $this->db->rollBack();
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
