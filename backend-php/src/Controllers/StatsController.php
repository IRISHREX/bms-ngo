<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use PDO;
use PDOException;

class StatsController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    private function getUploadUrl() {
        return $_ENV['UPLOAD_URL'] ?? 'http://localhost:5000/uploads';
    }

    public function getStats(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM donations");
            $donations = $stmt->fetch();
            
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM volunteers");
            $volunteers = $stmt->fetch();
            
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM gallery");
            $photos = $stmt->fetch();
            
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM notices");
            $notices = $stmt->fetch();
            
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM blog_posts");
            $blogs = $stmt->fetch();
            
            $stmt = $this->db->query("SELECT COUNT(*) as count FROM projects");
            $projects = $stmt->fetch();
            
            $stmt = $this->db->query("SELECT students_helped, meals_served, villages_reached FROM impact_stats WHERE id = 1");
            $impact = $stmt->fetch();

            $result = [
                'totalDonations' => (int)($donations['count'] ?? 0),
                'donationAmount' => (float)($donations['total'] ?? 0),
                'totalVolunteers' => (int)($volunteers['count'] ?? 0),
                'totalPhotos' => (int)($photos['count'] ?? 0),
                'totalNotices' => (int)($notices['count'] ?? 0),
                'totalBlogPosts' => (int)($blogs['count'] ?? 0),
                'totalProjects' => (int)($projects['count'] ?? 0),
                'studentsHelped' => (int)($impact['students_helped'] ?? 0),
                'mealsServed' => (int)($impact['meals_served'] ?? 0),
                'villagesReached' => (int)($impact['villages_reached'] ?? 0),
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getTransparency(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query(
                "SELECT 
                    COALESCE(SUM(amount), 0) AS totalRaised, 
                    COALESCE(SUM(CASE WHEN type = 'one-time' THEN amount ELSE 0 END), 0) AS oneTimeAmount, 
                    COALESCE(SUM(CASE WHEN type = 'monthly' THEN amount ELSE 0 END), 0) AS monthlyAmount, 
                    COALESCE(SUM(CASE WHEN type = 'campaign' THEN amount ELSE 0 END), 0) AS campaignAmount 
                 FROM donations"
            );
            $donationTotals = $stmt->fetch();

            $stmt = $this->db->query(
                "SELECT 
                    COALESCE(SUM(funds_used), 0) AS totalDisbursed, 
                    COUNT(*) AS totalProjects 
                 FROM projects"
            );
            $projectTotals = $stmt->fetch();

            $stmt = $this->db->query(
                "SELECT id, name, folder, file_path, created_at 
                 FROM files 
                 WHERE folder = 'reports' 
                 ORDER BY created_at DESC 
                 LIMIT 20"
            );
            $reportRows = $stmt->fetchAll();

            $totalRaised = (float)($donationTotals['totalRaised'] ?? 0);
            $totalDisbursed = (float)($projectTotals['totalDisbursed'] ?? 0);
            $availableBalance = $totalRaised - $totalDisbursed;

            $breakdown = [
                ['key' => 'one-time', 'label' => 'One-time Donations', 'amount' => (float)($donationTotals['oneTimeAmount'] ?? 0)],
                ['key' => 'monthly', 'label' => 'Monthly Donations', 'amount' => (float)($donationTotals['monthlyAmount'] ?? 0)],
                ['key' => 'campaign', 'label' => 'Campaign Donations', 'amount' => (float)($donationTotals['campaignAmount'] ?? 0)]
            ];

            foreach ($breakdown as &$item) {
                $item['pct'] = $totalRaised > 0 ? (int)round(($item['amount'] / $totalRaised) * 100) : 0;
            }

            $reports = [];
            foreach ($reportRows as $r) {
                $reports[] = [
                    'id' => (string)$r['id'],
                    'title' => $r['name'],
                    'type' => 'Financial Report',
                    'uploadedAt' => $r['created_at'],
                    'url' => $this->getUploadUrl() . '/' . $r['folder'] . '/' . basename($r['file_path'])
                ];
            }

            $result = [
                'totalRaised' => $totalRaised,
                'totalDisbursed' => $totalDisbursed,
                'availableBalance' => $availableBalance,
                'totalProjects' => (int)($projectTotals['totalProjects'] ?? 0),
                'breakdown' => $breakdown,
                'reports' => $reports
            ];

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function updateImpact(Request $request, Response $response, $args) {
        $body = json_decode($request->getBody(), true);
        
        $students = $body['studentsHelped'] ?? 0;
        $meals = $body['mealsServed'] ?? 0;
        $villages = $body['villagesReached'] ?? 0;

        try {
            $stmt = $this->db->prepare("UPDATE impact_stats SET students_helped = ?, meals_served = ?, villages_reached = ? WHERE id = 1");
            $stmt->execute([$students, $meals, $villages]);
            
            $response->getBody()->write(json_encode(["message" => "Impact stats updated"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function getActivity(Request $request, Response $response, $args) {
        // Returning empty array for now to prevent frontend breaking
        $response->getBody()->write(json_encode([]));
        return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
    }
}
