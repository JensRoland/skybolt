<?php

/**
 * Skybolt Inventory Endpoint
 *
 * Receives cache inventory updates from the client
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Skybolt\Skybolt;

// Start session
session_start();

// Create Skybolt instance
$skybolt = new Skybolt(
    manifestPath: __DIR__ . '/../dist/.vite/manifest.json',
    basePath: '/',
    session: $_SESSION
);

// Handle the inventory update
$skybolt->handleInventoryUpdate();

// Respond with 204 No Content
http_response_code(204);
