<?php
require 'vendor/autoload.php';
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();
$db = new App\Config\Database();
$conn = $db->getConnection();
var_dump($conn);
