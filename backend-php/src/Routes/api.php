<?php
use Slim\App;
use Slim\Routing\RouteCollectorProxy;
use App\Middleware\AuthMiddleware;
use App\Middleware\RoleMiddleware;

// Controllers (to be created)
use App\Controllers\AuthController;
use App\Controllers\StatsController;
use App\Controllers\ProjectsController;
use App\Controllers\UsersController;
use App\Controllers\NoticesController;
use App\Controllers\BlogController;
use App\Controllers\VolunteersController;
use App\Controllers\DonationsController;
use App\Controllers\FilesController;
use App\Controllers\GalleryController;
use App\Controllers\ThemeController;

return function (App $app) {
    
    // Handle OPTIONS requests for CORS
    $app->options('/{routes:.+}', function ($request, $response, $args) {
        return $response;
    });

    $app->group('/api', function (RouteCollectorProxy $group) {
        
        // --- PUBLIC ROUTES --- //

        // Auth
        $group->post('/auth/login', [AuthController::class, 'login']);

        // Stats
        $group->get('/stats', [StatsController::class, 'getStats']);
        $group->get('/stats/transparency', [StatsController::class, 'getTransparency']);

        // Projects (Public read)
        $group->get('/projects', [ProjectsController::class, 'getAll']);

        // Notices (Public read)
        $group->get('/notices', [NoticesController::class, 'getPublic']);

        // Blog (Public read)
        $group->get('/blog', [BlogController::class, 'getPublic']);

        // Volunteers (Public form submit)
        $group->post('/volunteers', [VolunteersController::class, 'create']);

        // Razorpay / Donations (Public endpoints)
        $group->post('/razorpay/order', [DonationsController::class, 'createOrder']);
        $group->post('/razorpay/verify', [DonationsController::class, 'verifyPayment']);
        $group->post('/razorpay/webhook', [DonationsController::class, 'webhook']);

        // Gallery (Public read)
        $group->get('/gallery', [GalleryController::class, 'getAll']);

        // Theme (Public read)
        $group->get('/theme', [ThemeController::class, 'getTheme']);

        // --- PROTECTED ROUTES --- //
        $group->group('', function (RouteCollectorProxy $protected) {
            
            // Auth
            $protected->post('/auth/logout', [AuthController::class, 'logout']);
            $protected->get('/auth/me', [AuthController::class, 'me']);
            
            // Projects
            $protected->post('/projects', [ProjectsController::class, 'create']);
            $protected->put('/projects/{id}', [ProjectsController::class, 'update']);
            $protected->delete('/projects/{id}', [ProjectsController::class, 'delete']);
            
            // Users (Super Admin Only)
            $protected->group('/users', function (RouteCollectorProxy $usersGroup) {
                $usersGroup->get('', [UsersController::class, 'getAll']);
                $usersGroup->post('', [UsersController::class, 'create']);
                $usersGroup->put('/{id}', [UsersController::class, 'update']);
                $usersGroup->delete('/{id}', [UsersController::class, 'delete']);
            })->add(new RoleMiddleware(['super_admin']));
            
            // Notices (Admin)
            $protected->group('/notices', function (RouteCollectorProxy $noticesGroup) {
                $noticesGroup->get('/admin', [NoticesController::class, 'getAdmin']);
                $noticesGroup->post('', [NoticesController::class, 'create']);
                $noticesGroup->put('/{id}', [NoticesController::class, 'update']);
                $noticesGroup->delete('/{id}', [NoticesController::class, 'delete']);
            });
            
            // Blog (Admin)
            $protected->group('/blog', function (RouteCollectorProxy $blogGroup) {
                $blogGroup->get('/admin', [BlogController::class, 'getAdmin']);
                $blogGroup->post('', [BlogController::class, 'create']);
                $blogGroup->put('/{id}', [BlogController::class, 'update']);
                $blogGroup->delete('/{id}', [BlogController::class, 'delete']);
            });

            // Volunteers (Admin)
            $protected->group('/volunteers', function (RouteCollectorProxy $volGroup) {
                $volGroup->get('', [VolunteersController::class, 'getAll']);
                $volGroup->get('/export', [VolunteersController::class, 'export']);
                $volGroup->put('/{id}', [VolunteersController::class, 'update']);
            });

            // Donations (Admin)
            $protected->group('/donations', function (RouteCollectorProxy $donationsGroup) {
                $donationsGroup->get('', [DonationsController::class, 'getAll']);
                $donationsGroup->post('', [DonationsController::class, 'create']);
                $donationsGroup->post('/{id}/receipt', [DonationsController::class, 'generateReceipt']);
                $donationsGroup->get('/report', [DonationsController::class, 'exportReport']);
            });

            // Files (Admin)
            $protected->group('/files', function (RouteCollectorProxy $filesGroup) {
                $filesGroup->get('', [FilesController::class, 'getAll']);
                $filesGroup->post('/upload', [FilesController::class, 'upload']);
                $filesGroup->delete('/{id}', [FilesController::class, 'delete']);
            });

            // Gallery (Admin)
            $protected->group('/gallery', function (RouteCollectorProxy $galleryGroup) {
                $galleryGroup->post('', [GalleryController::class, 'create']);
                $galleryGroup->put('/{id}', [GalleryController::class, 'update']);
                $galleryGroup->delete('/{id}', [GalleryController::class, 'delete']);
            });

            // Theme (Admin)
            $protected->put('/theme', [ThemeController::class, 'updateTheme']);

            // Impact Stats (Admin)
            $protected->put('/stats/impact', [StatsController::class, 'updateImpact']);
            $protected->get('/stats/activity', [StatsController::class, 'getActivity']);
            
        })->add(new AuthMiddleware());

    });

    // Catch-all route to serve a 404 Not Found page if none of the routes match
    // NOTE: make sure this route is defined last
    $app->map(['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], '/{routes:.+}', function ($request, $response) {
        $response->getBody()->write(json_encode(["error" => "Route not found"]));
        return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
    });
};
