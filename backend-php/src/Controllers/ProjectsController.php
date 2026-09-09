<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;

class ProjectsController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getAll(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM projects ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            
            $projects = array_map([$this, 'mapProject'], $rows);

            $response->getBody()->write(json_encode($projects));
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
        $location = $body['location'] ?? null;
        $budget = isset($body['budget']) ? (float)$body['budget'] : 0;
        $status = $body['status'] ?? 'planned';

        if (!$title) {
            $response->getBody()->write(json_encode(["error" => "Title is required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO projects (title, description, location, budget, status) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$title, $description, $location, $budget, $status]);
            
            $insertId = $this->db->lastInsertId();

            $response->getBody()->write(json_encode(["id" => (string)$insertId, "message" => "Project created"]));
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
        $location = $body['location'] ?? null;
        $budget = isset($body['budget']) ? (float)$body['budget'] : 0;
        $fundsUsed = isset($body['fundsUsed']) ? (float)$body['fundsUsed'] : 0;
        $status = $body['status'] ?? null;

        try {
            $stmt = $this->db->prepare("UPDATE projects SET title = ?, description = ?, location = ?, budget = ?, funds_used = ?, status = ? WHERE id = ?");
            $stmt->execute([$title, $description, $location, $budget, $fundsUsed, $status, $id]);
            
            $response->getBody()->write(json_encode(["message" => "Project updated"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, $args) {
        $id = $args['id'];
        
        try {
            $stmt = $this->db->prepare("DELETE FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode(["message" => "Project deleted"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    private function mapProject($row) {
        return [
            'id' => (string)$row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'location' => $row['location'],
            'budget' => (float)$row['budget'],
            'fundsUsed' => (float)$row['funds_used'],
            'status' => $row['status'],
            'photos' => [],
            'createdAt' => $row['created_at'],
        ];
    }
}
