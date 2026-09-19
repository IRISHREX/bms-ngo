<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;

class NoticesController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getPublic(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM notices WHERE status = 'active' AND (expiry_date IS NULL OR expiry_date >= CURDATE()) ORDER BY pinned DESC, publish_date DESC");
            $rows = $stmt->fetchAll();
            $notices = array_map([$this, 'mapNotice'], $rows);

            $response->getBody()->write(json_encode($notices));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getAdmin(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM notices ORDER BY pinned DESC, created_at DESC");
            $rows = $stmt->fetchAll();
            $notices = array_map([$this, 'mapNotice'], $rows);

            $response->getBody()->write(json_encode($notices));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function create(Request $request, Response $response, $args) {
        $body = json_decode($request->getBody(), true);
        
        $title = $body['title'] ?? null;
        $description = $body['description'] ?? null;
        $publishDate = !empty($body['publishDate']) ? $body['publishDate'] : null;
        $expiryDate = !empty($body['expiryDate']) ? $body['expiryDate'] : null;
        $pinned = !empty($body['pinned']) ? 1 : 0;
        $status = $body['status'] ?? 'draft';

        if (!$title) {
            $response->getBody()->write(json_encode(["error" => "Title is required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO notices (title, description, publish_date, expiry_date, pinned, status) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$title, $description, $publishDate, $expiryDate, $pinned, $status]);
            
            $insertId = $this->db->lastInsertId();

            $response->getBody()->write(json_encode(["id" => (string)$insertId, "message" => "Notice created"]));
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
        $description = $body['description'] ?? null;
        $publishDate = !empty($body['publishDate']) ? $body['publishDate'] : null;
        $expiryDate = !empty($body['expiryDate']) ? $body['expiryDate'] : null;
        $pinned = !empty($body['pinned']) ? 1 : 0;
        $status = $body['status'] ?? 'draft';

        try {
            $stmt = $this->db->prepare("UPDATE notices SET title = ?, description = ?, publish_date = ?, expiry_date = ?, pinned = ?, status = ? WHERE id = ?");
            $stmt->execute([$title, $description, $publishDate, $expiryDate, $pinned, $status, $id]);
            
            $response->getBody()->write(json_encode(["message" => "Notice updated"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, $args) {
        $id = $args['id'];
        
        try {
            $stmt = $this->db->prepare("DELETE FROM notices WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode(["message" => "Notice deleted"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function mapNotice($row) {
        return [
            'id' => (string)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'attachmentUrl' => !empty($row['attachment_file_id']) ? "/api/files/{$row['attachment_file_id']}/download" : null,
            'publishDate' => $row['publish_date'],
            'expiryDate' => $row['expiry_date'],
            'pinned' => (bool)$row['pinned'],
            'status' => $row['status'],
        ];
    }
}
