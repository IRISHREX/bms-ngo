<?php
namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;

class CorsMiddleware {
    public function __invoke(Request $request, RequestHandler $handler): Response {
        $response = $handler->handle($request);
        $origin = $_ENV['FRONTEND_URL'] ?? '*';
        // Strip trailing slash if present to avoid CORS issues
        $origin = rtrim($origin, '/');

        return $response
            ->withHeader('Access-Control-Allow-Origin', $origin)
            ->withHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    }
}
