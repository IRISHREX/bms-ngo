<?php
namespace App\Middleware;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Http\Server\RequestHandlerInterface as RequestHandler;
use Slim\Psr7\Response as SlimResponse;

class RoleMiddleware {
    private $allowedRoles;

    public function __construct(array $allowedRoles) {
        $this->allowedRoles = $allowedRoles;
    }

    public function __invoke(Request $request, RequestHandler $handler): Response {
        $user = $request->getAttribute('user');

        if (!$user || !isset($user->role) || !in_array($user->role, $this->allowedRoles)) {
            $response = new SlimResponse();
            $response->getBody()->write(json_encode(["error" => "Forbidden: Insufficient permissions"]));
            return $response
                ->withHeader('Content-Type', 'application/json')
                ->withStatus(403);
        }

        return $handler->handle($request);
    }
}
