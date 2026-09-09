<?php
namespace App\Controllers;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use App\Config\Database;
use Razorpay\Api\Api;
use PDO;
use PDOException;

class DonationsController {
    private $db;
    private $api;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        
        $keyId = $_ENV['RAZORPAY_KEY_ID'] ?? '';
        $keySecret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';
        
        if (!empty($keyId) && !empty($keySecret)) {
            $this->api = new Api($keyId, $keySecret);
        }
    }

    public function getAll(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM donations ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            $donations = array_map([$this, 'mapDonation'], $rows);

            $response->getBody()->write(json_encode($donations));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function create(Request $request, Response $response, $args) {
        $body = json_decode($request->getBody(), true);
        
        $donorName = $body['donorName'] ?? null;
        $amount = isset($body['amount']) ? (float)$body['amount'] : 0;
        $paymentId = $body['paymentId'] ?? '';
        $type = $body['type'] ?? 'one-time';
        $campaign = $body['campaign'] ?? null;

        try {
            $stmt = $this->db->prepare("INSERT INTO donations (donor_name, amount, payment_id, type, campaign) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$donorName, $amount, $paymentId, $type, $campaign]);
            
            $insertId = $this->db->lastInsertId();

            $response->getBody()->write(json_encode(["id" => (string)$insertId, "message" => "Donation recorded"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(201);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function generateReceipt(Request $request, Response $response, $args) {
        $id = $args['id'];
        
        try {
            $stmt = $this->db->prepare("UPDATE donations SET receipt_generated = TRUE WHERE id = ?");
            $stmt->execute([$id]);
            
            $response->getBody()->write(json_encode(["message" => "Receipt generated"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function exportReport(Request $request, Response $response, $args) {
        try {
            $stmt = $this->db->query("SELECT * FROM donations ORDER BY created_at DESC");
            $rows = $stmt->fetchAll();
            
            $csv = "Donor,Amount,Type,Payment ID,Campaign,Date,Receipt\n";
            foreach ($rows as $r) {
                $donor = str_replace('"', '""', $r['donor_name']);
                $amount = $r['amount'];
                $type = str_replace('"', '""', $r['type']);
                $paymentId = str_replace('"', '""', $r['payment_id']);
                $campaign = str_replace('"', '""', $r['campaign'] ?? '');
                $date = str_replace('"', '""', $r['created_at']);
                $receipt = $r['receipt_generated'] ? 1 : 0;
                
                $csv .= "\"$donor\",$amount,\"$type\",\"$paymentId\",\"$campaign\",\"$date\",$receipt\n";
            }

            $response->getBody()->write($csv);
            return $response
                ->withHeader('Content-Type', 'text/csv')
                ->withHeader('Content-Disposition', 'attachment; filename="donations-report.csv"')
                ->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    // --- RAZORPAY ROUTES ---

    public function createOrder(Request $request, Response $response, $args) {
        if (!$this->api) {
            $response->getBody()->write(json_encode(["error" => "Razorpay SDK not configured"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }

        $body = json_decode($request->getBody(), true);
        $amount = $body['amount'] ?? 0;
        $currency = $body['currency'] ?? 'INR';
        $donorName = $body['donorName'] ?? 'Anonymous';
        $type = $body['type'] ?? 'one-time';
        $campaign = $body['campaign'] ?? '';

        if (!$amount || $amount < 100) {
            $response->getBody()->write(json_encode(["error" => "Minimum amount is ₹1 (100 paise)"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $orderData = [
                'receipt'         => 'rcptid_11',
                'amount'          => round((float)$amount * 100), // rupees to paise
                'currency'        => $currency,
                'notes'           => [
                    'donorName' => $donorName,
                    'type' => $type,
                    'campaign' => $campaign
                ]
            ];

            $order = $this->api->order->create($orderData);

            $response->getBody()->write(json_encode([
                "orderId" => $order['id'],
                "amount" => $order['amount'],
                "currency" => $order['currency'],
                "keyId" => $_ENV['RAZORPAY_KEY_ID']
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function verifyPayment(Request $request, Response $response, $args) {
        $body = json_decode($request->getBody(), true);
        $orderId = $body['razorpay_order_id'] ?? '';
        $paymentId = $body['razorpay_payment_id'] ?? '';
        $signature = $body['razorpay_signature'] ?? '';
        $donorName = $body['donorName'] ?? 'Anonymous';
        $amount = $body['amount'] ?? 0;
        $type = $body['type'] ?? 'one-time';
        $campaign = $body['campaign'] ?? null;

        $secret = $_ENV['RAZORPAY_KEY_SECRET'] ?? '';
        $expectedSig = hash_hmac('sha256', $orderId . "|" . $paymentId, $secret);

        if (!hash_equals($expectedSig, $signature)) {
            $response->getBody()->write(json_encode(["error" => "Payment verification failed"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $stmt = $this->db->prepare("INSERT INTO donations (donor_name, amount, payment_id, type, campaign) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$donorName, $amount, $paymentId, $type, $campaign]);
            
            $insertId = $this->db->lastInsertId();

            $response->getBody()->write(json_encode([
                "success" => true,
                "donationId" => (string)$insertId,
                "paymentId" => $paymentId
            ]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        } catch (PDOException $e) {
            $response->getBody()->write(json_encode(["error" => $e->getMessage()]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(500);
        }
    }

    public function webhook(Request $request, Response $response, $args) {
        $signature = $request->getHeaderLine('X-Razorpay-Signature');
        // Get raw body as string
        $rawBody = (string)$request->getBody();
        $secret = $_ENV['RAZORPAY_WEBHOOK_SECRET'] ?? '';

        if (empty($secret)) {
            $response->getBody()->write(json_encode(["status" => "error_logged", "message" => "Webhook secret not configured"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }

        $expectedSig = hash_hmac('sha256', $rawBody, $secret);

        if (!hash_equals($expectedSig, $signature)) {
            $response->getBody()->write(json_encode(["error" => "Invalid signature"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(400);
        }

        try {
            $event = json_decode($rawBody, true);
            $eventType = $event['event'] ?? '';
            $payload = $event['payload'] ?? [];

            if ($eventType === 'payment.captured') {
                $payment = $payload['payment']['entity'] ?? [];
                $paymentId = $payment['id'] ?? '';
                $amountInRupees = isset($payment['amount']) ? $payment['amount'] / 100 : 0;
                $notes = $payment['notes'] ?? [];

                // Check if exists
                $stmt = $this->db->prepare("SELECT id FROM donations WHERE payment_id = ?");
                $stmt->execute([$paymentId]);
                $existing = $stmt->fetch();

                if (!$existing) {
                    $insertStmt = $this->db->prepare("INSERT INTO donations (donor_name, amount, payment_id, type, campaign, webhook_verified) VALUES (?, ?, ?, ?, ?, TRUE)");
                    $insertStmt->execute([
                        $notes['donorName'] ?? 'Anonymous',
                        $amountInRupees,
                        $paymentId,
                        $notes['type'] ?? 'one-time',
                        $notes['campaign'] ?? null
                    ]);
                } else {
                    $updateStmt = $this->db->prepare("UPDATE donations SET webhook_verified = TRUE WHERE payment_id = ?");
                    $updateStmt->execute([$paymentId]);
                }
            }
            // For brevity, skipping payment.failed/refund.processed logging unless payment_events table exists.
            // The original node logic logged these to a payment_events table.
            
            $response->getBody()->write(json_encode(["status" => "ok"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
            
        } catch (\Exception $e) {
            $response->getBody()->write(json_encode(["status" => "error_logged"]));
            return $response->withHeader('Content-Type', 'application/json')->withStatus(200);
        }
    }

    private function mapDonation($row) {
        return [
            'id' => (string)$row['id'],
            'donorName' => $row['donor_name'],
            'amount' => (float)$row['amount'],
            'date' => $row['created_at'],
            'paymentId' => $row['payment_id'],
            'receiptGenerated' => (bool)$row['receipt_generated'],
            'type' => $row['type'],
            'campaign' => $row['campaign'] ?? null,
        ];
    }
}
