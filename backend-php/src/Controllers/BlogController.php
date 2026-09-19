<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;

class BlogController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    private function getUploadUrl() {
        return rtrim($_ENV['UPLOAD_URL'] ?? 'http://localhost:5000/uploads', '/');
    }

    public function getPublic(Request $request, Response $response, $args) {
        try {
            $sql = "SELECT b.*, f.file_path, f.folder 
                    FROM blog_posts b 
                    LEFT JOIN files f ON b.cover_image_file_id = f.id 
                    WHERE b.status = 'published' 
                    ORDER BY b.created_at DESC";
            
            $stmt = $this->db->query($sql);
            $rows = $stmt->fetchAll();
            $posts = array_map([$this, 'mapPost'], $rows);

            $response->getBody()->write(json_encode($posts));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getAdmin(Request $request, Response $response, $args) {
        try {
            $sql = "SELECT b.*, f.file_path, f.folder 
                    FROM blog_posts b 
                    LEFT JOIN files f ON b.cover_image_file_id = f.id 
                    ORDER BY b.created_at DESC";
            
            $stmt = $this->db->query($sql);
            $rows = $stmt->fetchAll();
            $posts = array_map([$this, 'mapPost'], $rows);

            $response->getBody()->write(json_encode($posts));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function create(Request $request, Response $response, $args) {
        $body = json_decode($request->getBody(), true);
        
        $title = $body['title'] ?? null;
        $content = $body['content'] ?? null;
        $status = $body['status'] ?? 'draft';
        $tags = isset($body['tags']) && is_array($body['tags']) ? json_encode($body['tags']) : json_encode([]);
        $coverImage = !empty($body['coverImage']) ? $body['coverImage'] : null;

        if (!$title || !$content) {
            $response->getBody()->write(json_encode(["error" => "Title and content are required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO blog_posts (title, content, status, tags, cover_image_file_id) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$title, $content, $status, $tags, $coverImage]);
            
            $insertId = $this->db->lastInsertId();

            $response->getBody()->write(json_encode(["id" => (string)$insertId, "message" => "Post created"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function update(Request $request, Response $response, $args) {
        $id = $args['id'];
        $body = json_decode($request->getBody(), true);
        
        $title = $body['title'] ?? null;
        $content = $body['content'] ?? null;
        $status = $body['status'] ?? 'draft';
        $tags = isset($body['tags']) && is_array($body['tags']) ? json_encode($body['tags']) : json_encode([]);
        
        try {
            if (array_key_exists('coverImage', $body)) {
                $coverImage = !empty($body['coverImage']) ? $body['coverImage'] : null;
                $stmt = $this->db->prepare("UPDATE blog_posts SET title = ?, content = ?, status = ?, tags = ?, cover_image_file_id = ? WHERE id = ?");
                $stmt->execute([$title, $content, $status, $tags, $coverImage, $id]);
            } else {
                $stmt = $this->db->prepare("UPDATE blog_posts SET title = ?, content = ?, status = ?, tags = ? WHERE id = ?");
                $stmt->execute([$title, $content, $status, $tags, $id]);
            }
            
            $response->getBody()->write(json_encode(["message" => "Post updated"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, $args) {
        $id = $args['id'];
        
        try {
            $stmt = $this->db->prepare("DELETE FROM blog_posts WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode(["message" => "Post deleted"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function mapPost($row) {
        $tags = [];
        if (!empty($row['tags'])) {
            $parsed = json_decode($row['tags'], true);
            if (is_array($parsed)) {
                $tags = $parsed;
            }
        }
        
        $coverImageUrl = null;
        if (!empty($row['file_path'])) {
            $folder = !empty($row['folder']) ? $row['folder'] : basename(dirname($row['file_path']));
            $filename = basename($row['file_path']);
            $coverImageUrl = $this->getUploadUrl() . "/" . $folder . "/" . $filename;
        }

        return [
            'id' => (string)$row['id'],
            'title' => $row['title'],
            'content' => $row['content'],
            'coverImage' => $coverImageUrl,
            'status' => $row['status'],
            'tags' => $tags,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
        ];
    }
}
