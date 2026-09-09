<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;

class ThemeController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function getTheme(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT theme_key as themeKey, label, description, sort_order as sortOrder FROM themes_catalog ORDER BY sort_order ASC");
            $themes = $stmt->fetchAll();
            
            $stmt2 = $this->db->query("SELECT theme_key as themeKey FROM theme_settings WHERE id = 1 LIMIT 1");
            $setting = $stmt2->fetch();
            
            $fallback = !empty($themes) ? $themes[0]['themeKey'] : 'forest';
            $currentThemeKey = $setting ? $setting['themeKey'] : $fallback;
            
            $result = [
                'currentThemeKey' => $currentThemeKey,
                'themes' => $themes
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function updateTheme(Request $request, Response $response, $args) {
        $body = json_decode($request->getBody(), true);
        $themeKey = $body['themeKey'] ?? null;

        if (!$themeKey || !is_string($themeKey)) {
            $response->getBody()->write(json_encode(["error" => "themeKey is required"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("SELECT theme_key FROM themes_catalog WHERE theme_key = ? LIMIT 1");
            $stmt->execute([$themeKey]);
            if (!$stmt->fetch()) {
                $response->getBody()->write(json_encode(["error" => "Invalid themeKey"]));
                return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
            }

            // Insert or Update logic (MySQL specific)
            $updateStmt = $this->db->prepare("INSERT INTO theme_settings (id, theme_key) VALUES (1, ?) ON DUPLICATE KEY UPDATE theme_key = VALUES(theme_key)");
            $updateStmt->execute([$themeKey]);

            $response->getBody()->write(json_encode(["message" => "Theme updated", "themeKey" => $themeKey]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }
}
