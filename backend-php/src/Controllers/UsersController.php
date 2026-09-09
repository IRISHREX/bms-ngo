<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;

class UsersController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getAll(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT id, name, email, role, status, created_at as createdAt FROM users ORDER BY created_at DESC");
            $users = $stmt->fetchAll();
            
            // Convert IDs to strings to match Node behavior
            foreach ($users as &$u) {
                $u['id'] = (string)$u['id'];
            }

            $response->getBody()->write(json_encode($users));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function create(Request $request, Response $response, $args) {
        $body = json_decode($request->getBody(), true);
        $name = $body['name'] ?? null;
        $email = $body['email'] ?? null;
        $password = $body['password'] ?? null;
        $role = $body['role'] ?? 'content_manager';

        if (!$name || !$email || !$password) {
            $response->getBody()->write(json_encode(["error" => "Name, email, and password are required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
            
            $stmt = $this->db->prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
            $stmt->execute([$name, $email, $hash, $role]);
            
            $insertId = $this->db->lastInsertId();

            $response->getBody()->write(json_encode(["id" => (string)$insertId, "message" => "User created"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
            
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) { // ER_DUP_ENTRY equivalent in PDO
                $response->getBody()->write(json_encode(["error" => "Email already exists"]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function update(Request $request, Response $response, $args) {
        $id = $args['id'];
        $body = json_decode($request->getBody(), true);
        $role = $body['role'] ?? null;
        $status = $body['status'] ?? null;

        if (!$role || !$status) {
            $response->getBody()->write(json_encode(["error" => "Role and status are required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("UPDATE users SET role = ?, status = ? WHERE id = ?");
            $stmt->execute([$role, $status, $id]);
            
            $response->getBody()->write(json_encode(["message" => "User updated"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function delete(Request $request, Response $response, $args) {
        $id = $args['id'];
        
        try {
            $stmt = $this->db->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode(["message" => "User deleted"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
