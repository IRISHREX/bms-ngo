<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use Firebase\JWT\JWT;
use PDO;

class AuthController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function login(Request $request, Response $response, $args) {
        $body = json_decode($request->getBody(), true);
        $email = $body['email'] ?? '';
        $password = $body['password'] ?? '';

        if (empty($email) || empty($password)) {
            $response->getBody()->write(json_encode(["error" => "Email and password are required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                if ($user['status'] !== 'active') {
                    $response->getBody()->write(json_encode(["error" => "Account is inactive"]));
                    return $response->withHeader('Content-Type', 'application/json')->withStatus(403);
                }

                $secret = $_ENV['JWT_SECRET'] ?? 'default_secret_please_change';
                $payload = [
                    'id' => $user['id'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'iat' => time(),
                    'exp' => time() + (86400 * 7) // 7 days expiration
                ];

                $token = JWT::encode($payload, $secret, 'HS256');

                // Don't send password hash back
                unset($user['password_hash']);

                $response->getBody()->write(json_encode([
                    "token" => $token,
                    "user" => $user
                ]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            }

            $response->getBody()->write(json_encode(["error" => "Invalid credentials"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(401);

        } catch (\PDOException $e) {
            $response->getBody()->write(json_encode(["error" => "Database error: " . $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function logout(Request $request, Response $response, $args) {
        // JWT is stateless, so we just tell the client to discard it
        $response->getBody()->write(json_encode(["message" => "Logged out successfully"]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }

    public function me(Request $request, Response $response, $args) {
        $jwtUser = $request->getAttribute('user');
        
        try {
            $stmt = $this->db->prepare("SELECT id, name, email, role, status, created_at FROM users WHERE id = ? LIMIT 1");
            $stmt->execute([$jwtUser->id]);
            $user = $stmt->fetch();

            if ($user) {
                $response->getBody()->write(json_encode(["user" => $user]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            }

            $response->getBody()->write(json_encode(["error" => "User not found"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(404);
            
        } catch (\PDOException $e) {
            $response->getBody()->write(json_encode(["error" => "Database error"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
