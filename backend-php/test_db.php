<?php
require 'vendor/autoload.php';
$db = new App\Config\Database();
$conn = $db->getConnection();
var_dump($conn);
