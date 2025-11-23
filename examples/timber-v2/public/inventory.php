<?php

/**
 * Skybolt Inventory Endpoint
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\Skybolt;

session_start();

$skybolt = new Skybolt(
    manifestPath: __DIR__ . '/../dist/.vite/manifest.json',
    basePath: '/',
    session: $_SESSION
);

$skybolt->handleInventoryUpdate();

http_response_code(204);
