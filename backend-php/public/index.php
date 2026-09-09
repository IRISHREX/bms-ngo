<?php
require __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use App\Middleware\CorsMiddleware;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__ . '/../');
$dotenv->load();

// Create App
$app = AppFactory::create();

// Add Error Middleware
$app->addErrorMiddleware(true, true, true);

// Add CORS Middleware
$app->add(new CorsMiddleware());

// Register Routes
(require __DIR__ . '/../src/Routes/api.php')($app);

// Run App
$app->run();
