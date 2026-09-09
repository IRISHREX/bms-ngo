<?php
namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Exception;
use Slim\Psr7\Response as SlimResponse;

class AuthMiddleware {
    public function __invoke(Request $request, RequestHandler $handler): Response {
        $header = $request->getHeaderLine('Authorization');
        
        if (empty($header) || !preg_match('/Bearer\s(\S+)/', $header, $matches)) {
            return $this->unauthorizedResponse();
        }

        $token = $matches[1];
        $secret = $_ENV['JWT_SECRET'] ?? 'default_secret_please_change';

        try {
            $decoded = JWT::decode($token, new Key($secret, 'HS256'));
            // Add decoded user info to the request attributes
            $request = $request->withAttribute('user', $decoded);
        } catch (Exception $e) {
            return $this->unauthorizedResponse("Invalid or expired token");
        }

        return $handler->handle($request);
    }

    private function unauthorizedResponse($message = "Unauthorized access") {
        $response = new SlimResponse();
        $response->getBody()->write(json_encode(["error" => $message]));
        return $response
            ->withHeader('Content-Type', 'application/json')
            ->withStatus(401);
    }
}
